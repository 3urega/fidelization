/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { randomUUID } from "crypto";

import { prisma } from "../src/lib/prisma";
import { DEMO_TENANT_ID } from "../src/lib/tenant/mockTenantBySlug";

/**
 * E2E smoke: GET /api/user/search-zone/nearby-establishments (Phase T4 #101).
 * Requires dev server + DATABASE_URL.
 */
const baseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000").replace(/\/$/, "");

const BARCELONA_LAT = 41.3874;
const BARCELONA_LNG = 2.1686;
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

	const unauthenticated = await fetch(
		`${baseUrl}/api/user/search-zone/nearby-establishments?lat=${BARCELONA_LAT}&lng=${BARCELONA_LNG}`,
	);

	if (unauthenticated.status !== 401) {
		console.error("❌ unauthenticated nearby-establishments expected 401", unauthenticated.status);
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
		const email = `verify-map-markers-${randomUUID()}@example.local`;
		const password = "password123";

		const register = await fetch(`${baseUrl}/api/auth/register/user`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name: "Map Markers User", email, password }),
		});

		const userCookie = parseSessionCookie(register.headers.get("set-cookie"));
		if (register.status !== 201 || !userCookie) {
			console.error("❌ register user failed", register.status);
			process.exit(1);
		}

		console.log("✅ user session ready");

		const headers = sessionHeaders(userCookie);

		const missingCoords = await fetch(`${baseUrl}/api/user/search-zone/nearby-establishments`, {
			headers,
		});
		const missingBody = (await missingCoords.json()) as { error?: { description?: string } };

		if (missingCoords.status !== 400 || !missingBody.error?.description?.includes("lat and lng")) {
			console.error("❌ missing lat/lng should return 400", missingCoords.status, missingBody);
			process.exit(1);
		}

		console.log("✅ missing lat/lng → 400");

		const invalid = await fetch(
			`${baseUrl}/api/user/search-zone/nearby-establishments?lat=invalid&lng=${BARCELONA_LNG}`,
			{ headers },
		);
		const invalidBody = (await invalid.json()) as { error?: { type?: string } };

		if (invalid.status !== 400 || invalidBody.error?.type !== "InvalidDiscoverNearFilter") {
			console.error("❌ invalid lat should return 400 InvalidDiscoverNearFilter", invalid.status, invalidBody);
			process.exit(1);
		}

		console.log("✅ invalid lat → 400 InvalidDiscoverNearFilter");

		const response = await fetch(
			`${baseUrl}/api/user/search-zone/nearby-establishments?lat=${BARCELONA_LAT}&lng=${BARCELONA_LNG}&radiusKm=50`,
			{ headers },
		);
		const body = (await response.json()) as {
			markers?: {
				id: string;
				slug: string;
				name: string;
				latitude: number;
				longitude: number;
				logoUrl?: string;
			}[];
		};

		if (!response.ok || !Array.isArray(body.markers)) {
			console.error("❌ nearby-establishments failed", response.status, body);
			process.exit(1);
		}

		const demoMarker = body.markers.find((marker) => marker.slug === "cafe-demo");

		if (
			!demoMarker ||
			typeof demoMarker.latitude !== "number" ||
			typeof demoMarker.longitude !== "number"
		) {
			console.error("❌ demo tenant missing from markers with coords", body);
			process.exit(1);
		}

		console.log(`✅ nearby-establishments returns cafe-demo at ${demoMarker.latitude}, ${demoMarker.longitude}`);
		console.log("✅ verify:search-zone-map-markers passed");
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
