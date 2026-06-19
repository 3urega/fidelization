/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { randomUUID } from "crypto";

import { prisma } from "../src/lib/prisma";
import {
	buildDiscoverEstablishmentsQuery,
	resolveDiscoverActiveNear,
} from "../src/lib/platform/buildDiscoverEstablishmentsQuery";
import { DEMO_TENANT_ID } from "../src/lib/tenant/mockTenantBySlug";

/**
 * Phase S5 #97 — discover grid + saved search zone + copy UX.
 * Unit: resolveDiscoverActiveNear; E2E: search zone PATCH + near API (dev + DATABASE_URL).
 */
const baseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000").replace(/\/$/, "");

const TERRASSA_LAT = 41.5639;
const TERRASSA_LNG = 2.0084;
const DEMO_LAT = 41.39;
const DEMO_LNG = 2.17;

function assertResolveDiscoverActiveNearFixtures(): void {
	const zone = {
		label: "Terrassa, Barcelona",
		latitude: TERRASSA_LAT,
		longitude: TERRASSA_LNG,
	};

	const withZone = resolveDiscoverActiveNear({
		nearMeEnabled: false,
		gps: null,
		searchZone: zone,
	});

	if (withZone.mode !== "saved_zone" || withZone.contextLabel !== zone.label) {
		console.error("❌ saved zone fixture", withZone);
		process.exit(1);
	}

	const query = buildDiscoverEstablishmentsQuery({
		offset: 0,
		limit: 12,
		near: withZone.near,
	});

	if (!query.includes(`lat=${TERRASSA_LAT}`) || !query.includes(`lng=${TERRASSA_LNG}`)) {
		console.error("❌ zone near query", query);
		process.exit(1);
	}

	console.log("✅ resolveDiscoverActiveNear + query from saved zone");
}

function parseSessionCookie(setCookie: string | null): string | null {
	if (!setCookie) {
		return null;
	}

	const match = /session=([^;]+)/.exec(setCookie);

	return match?.[1] ?? null;
}

async function ensureTenantGeocodingColumns(): Promise<void> {
	await prisma.$executeRawUnsafe(`
		ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION;
		ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION;
		ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "geocoding_provider" TEXT;
		ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "geocoded_at" TIMESTAMP(3);
	`);
}

async function ensureUserSearchZoneColumns(): Promise<void> {
	await prisma.$executeRawUnsafe(`
		ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "search_zone_label" TEXT;
		ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "search_zone_latitude" DOUBLE PRECISION;
		ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "search_zone_longitude" DOUBLE PRECISION;
		ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "search_zone_updated_at" TIMESTAMP(3);
	`);
}

async function assertSearchZoneGridE2E(): Promise<void> {
	if (!process.env.DATABASE_URL) {
		console.error("❌ DATABASE_URL required for E2E");
		process.exit(1);
	}

	await ensureTenantGeocodingColumns();
	await ensureUserSearchZoneColumns();

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
		const email = `verify-grid-zone-${randomUUID()}@example.local`;
		const password = "password123";

		const register = await fetch(`${baseUrl}/api/auth/register/user`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name: "Grid Zone User", email, password }),
		});

		const userCookie = parseSessionCookie(register.headers.get("set-cookie"));
		if (register.status !== 201 || !userCookie) {
			console.error("❌ register user failed");
			process.exit(1);
		}

		const headers = { cookie: `session=${userCookie}` };

		const noNearList = await fetch(`${baseUrl}/api/user/establishments?limit=6&offset=0`, {
			headers,
		});
		const noNearBody = (await noNearList.json()) as {
			establishments?: unknown[];
			hasMore?: boolean;
		};

		if (
			!noNearList.ok ||
			!Array.isArray(noNearBody.establishments) ||
			noNearBody.establishments.length === 0
		) {
			console.error("❌ establishments without near filter", noNearList.status, noNearBody);
			process.exit(1);
		}

		console.log("✅ user without zone gets full establishments list");

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
			console.error("❌ GET /api/user/me missing searchZone", meBody);
			process.exit(1);
		}

		console.log("✅ PATCH search zone persisted");

		const proximity = resolveDiscoverActiveNear({
			nearMeEnabled: false,
			gps: null,
			searchZone: {
				label: "Terrassa, Barcelona",
				latitude: TERRASSA_LAT,
				longitude: TERRASSA_LNG,
			},
		});

		const zoneQuery = buildDiscoverEstablishmentsQuery({
			offset: 0,
			limit: 20,
			near: { ...proximity.near!, radiusKm: 50 },
		});
		const zoneList = await fetch(`${baseUrl}/api/user/establishments?${zoneQuery}`, { headers });
		const zoneBody = (await zoneList.json()) as {
			establishments?: { slug: string; distanceKm?: number }[];
		};

		if (!zoneList.ok || !Array.isArray(zoneBody.establishments)) {
			console.error("❌ zone-filtered establishments", zoneList.status, zoneBody);
			process.exit(1);
		}

		const demoRow = zoneBody.establishments.find((row) => row.slug === "cafe-demo");
		if (!demoRow || typeof demoRow.distanceKm !== "number") {
			console.error("❌ cafe-demo distanceKm missing with zone filter", zoneBody);
			process.exit(1);
		}

		console.log(`✅ zone-filtered API returns distanceKm=${demoRow.distanceKm} for cafe-demo`);

		const home = await fetch(`${baseUrl}/home`, { headers });
		const homeHtml = await home.text();

		if (home.status !== 200 || !homeHtml.includes("Explorar")) {
			console.error("❌ GET /home missing Explorar tab shell", home.status);
			process.exit(1);
		}

		console.log("✅ GET /home shell includes Explorar tab (grid UX hydrates client-side)");
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

async function main(): Promise<void> {
	assertResolveDiscoverActiveNearFixtures();
	await assertSearchZoneGridE2E();
	console.log("✅ verify:discover-grid-search-zone passed");
}

void main();
