/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { randomUUID } from "crypto";

import { prisma } from "../src/lib/prisma";
import { DEMO_TENANT_ID } from "../src/lib/tenant/mockTenantBySlug";

/**
 * E2E smoke: interactive search zone editor APIs (Phase T5 #102).
 * Requires dev server + DATABASE_URL.
 */
const baseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000").replace(/\/$/, "");

const TERRASSA_LAT = 41.5639;
const TERRASSA_LNG = 2.0084;
const DEMO_LAT = 41.39;
const DEMO_LNG = 2.17;

function parseSessionCookie(setCookie: string | null): string | null {
	if (!setCookie) {
		return null;
	}

	const match = /session=([^;]+)/.exec(setCookie);

	return match?.[1] ?? null;
}

function sessionHeaders(session: string): { cookie: string } {
	return { cookie: `session=${session}` };
}

async function ensureTenantGeocodingColumns(): Promise<void> {
	await prisma.$executeRawUnsafe(`
		ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION;
		ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION;
		ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "geocoding_provider" TEXT;
		ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "geocoded_at" TIMESTAMP(3);
	`);
}

async function main(): Promise<void> {
	if (!process.env.DATABASE_URL) {
		console.error("❌ DATABASE_URL required");
		process.exit(1);
	}

	await ensureTenantGeocodingColumns();

	const unauthenticatedSuggest = await fetch(`${baseUrl}/api/user/search-zone/suggest?q=Terr`);
	if (unauthenticatedSuggest.status !== 401) {
		console.error("❌ unauthenticated suggest expected 401", unauthenticatedSuggest.status);
		process.exit(1);
	}

	console.log("✅ unauthenticated suggest → 401");

	const unauthenticatedNearby = await fetch(
		`${baseUrl}/api/user/search-zone/nearby-establishments?lat=${TERRASSA_LAT}&lng=${TERRASSA_LNG}`,
	);
	if (unauthenticatedNearby.status !== 401) {
		console.error("❌ unauthenticated nearby expected 401", unauthenticatedNearby.status);
		process.exit(1);
	}

	console.log("✅ unauthenticated nearby-establishments → 401");

	const demoBefore = await prisma.tenant.findUnique({
		where: { id: DEMO_TENANT_ID },
		select: { latitude: true, longitude: true },
	});

	if (!demoBefore) {
		console.error("❌ demo tenant not found");
		process.exit(1);
	}

	const originalLatitude = demoBefore.latitude;
	const originalLongitude = demoBefore.longitude;

	await prisma.tenant.update({
		where: { id: DEMO_TENANT_ID },
		data: {
			latitude: DEMO_LAT,
			longitude: DEMO_LNG,
			geocodingProvider: "verify",
			geocodedAt: new Date(),
		},
	});

	try {
		const email = `verify-search-zone-interactive-${randomUUID()}@example.local`;
		const password = "password123";

		const register = await fetch(`${baseUrl}/api/auth/register/user`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name: "Interactive Editor User", email, password }),
		});

		const userCookie = parseSessionCookie(register.headers.get("set-cookie"));
		if (register.status !== 201 || !userCookie) {
			console.error("❌ register user failed", register.status);
			process.exit(1);
		}

		console.log("✅ user session ready");

		const headers = sessionHeaders(userCookie);

		const missingNearby = await fetch(`${baseUrl}/api/user/search-zone/nearby-establishments`, {
			headers,
		});
		if (missingNearby.status !== 400) {
			console.error("❌ missing lat/lng expected 400", missingNearby.status);
			process.exit(1);
		}

		console.log("✅ missing lat/lng → 400");

		const mapConfig = await fetch(`${baseUrl}/api/user/search-zone/map-client-config`, { headers });
		if (mapConfig.status !== 200 && mapConfig.status !== 503) {
			console.error("❌ map-client-config unexpected status", mapConfig.status);
			process.exit(1);
		}

		console.log(`✅ map-client-config → ${mapConfig.status}`);

		const hasMapboxToken = Boolean(process.env.MAPBOX_ACCESS_TOKEN?.trim());
		const hasGoogleKey = Boolean(process.env.GOOGLE_MAPS_GEOCODING_API_KEY?.trim());
		const hasSuggestCredentials = hasMapboxToken || hasGoogleKey;

		const suggest = await fetch(`${baseUrl}/api/user/search-zone/suggest?q=Terr&limit=3`, {
			headers,
		});
		const suggestBody = (await suggest.json()) as { suggestions?: unknown[] };

		if (hasSuggestCredentials) {
			if (!suggest.ok || !Array.isArray(suggestBody.suggestions)) {
				console.error("❌ live suggest failed", suggest.status, suggestBody);
				process.exit(1);
			}

			console.log(`✅ suggest returns ${suggestBody.suggestions.length} suggestion(s)`);
		} else if (suggest.ok && Array.isArray(suggestBody.suggestions)) {
			console.log("✅ suggest OK without live provider credentials");
		} else {
			console.error("❌ unexpected suggest response", suggest.status, suggestBody);
			process.exit(1);
		}

		const nearby = await fetch(
			`${baseUrl}/api/user/search-zone/nearby-establishments?lat=${TERRASSA_LAT}&lng=${TERRASSA_LNG}&radiusKm=50`,
			{ headers },
		);
		const nearbyBody = (await nearby.json()) as {
			markers?: { slug?: string; latitude?: number; longitude?: number }[];
		};

		if (!nearby.ok || !Array.isArray(nearbyBody.markers)) {
			console.error("❌ nearby-establishments failed", nearby.status, nearbyBody);
			process.exit(1);
		}

		const demoMarker = nearbyBody.markers.find((marker) => marker.slug === "cafe-demo");
		if (
			!demoMarker ||
			typeof demoMarker.latitude !== "number" ||
			typeof demoMarker.longitude !== "number"
		) {
			console.error("❌ demo marker missing from nearby results", nearbyBody);
			process.exit(1);
		}

		console.log("✅ nearby-establishments includes cafe-demo with coords");

		const patch = await fetch(`${baseUrl}/api/user/me/search-zone`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json", ...headers },
			body: JSON.stringify({
				label: "Terrassa, Barcelona",
				latitude: TERRASSA_LAT,
				longitude: TERRASSA_LNG,
			}),
		});

		if (!patch.ok) {
			console.error("❌ PATCH search-zone failed", patch.status, await patch.text());
			process.exit(1);
		}

		const me = await fetch(`${baseUrl}/api/user/me`, { headers });
		const meBody = (await me.json()) as {
			user?: { searchZone?: { label?: string; latitude?: number } | null };
		};

		if (!me.ok || meBody.user?.searchZone?.label !== "Terrassa, Barcelona") {
			console.error("❌ GET /api/user/me missing saved zone", meBody);
			process.exit(1);
		}

		console.log("✅ PATCH + GET /api/user/me confirm saved zone");

		const profile = await fetch(`${baseUrl}/home/profile`, { headers });
		const profileHtml = await profile.text();

		if (
			profile.status !== 200 ||
			!profileHtml.includes("Tu perfil") ||
			!profileHtml.includes("Información personal")
		) {
			console.error("❌ profile shell missing expected copy", profile.status);
			process.exit(1);
		}

		console.log("✅ GET /home/profile shell OK (editor hydrates client-side)");
		console.log("✅ verify:search-zone-editor-interactive passed");
	} finally {
		await prisma.tenant.update({
			where: { id: DEMO_TENANT_ID },
			data: {
				latitude: originalLatitude,
				longitude: originalLongitude,
				...(originalLatitude === null && originalLongitude === null
					? { geocodingProvider: null, geocodedAt: null }
					: {}),
			},
		});
	}
}

void main();
