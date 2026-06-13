/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { randomUUID } from "crypto";

import { prisma } from "../src/lib/prisma";
import { DEMO_TENANT_ID } from "../src/lib/tenant/mockTenantBySlug";

/**
 * E2E: GET /api/user/establishments?lat=&lng=&radiusKm= near filter.
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
		const email = `verify-discover-near-${randomUUID()}@example.local`;
		const password = "password123";

		const register = await fetch(`${baseUrl}/api/auth/register/user`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name: "Discover Near User", email, password }),
		});

		const userCookie = parseSessionCookie(register.headers.get("set-cookie"));
		if (register.status !== 201 || !userCookie) {
			console.error("❌ register user failed");
			process.exit(1);
		}

		const headers = { cookie: `session=${userCookie}` };

		const invalid = await fetch(
			`${baseUrl}/api/user/establishments?lat=invalid&lng=${BARCELONA_LNG}`,
			{ headers },
		);
		const invalidBody = (await invalid.json()) as { error?: { type?: string } };

		if (invalid.status !== 400 || invalidBody.error?.type !== "InvalidDiscoverNearFilter") {
			console.error("❌ invalid lat should return 400 InvalidDiscoverNearFilter", invalid.status, invalidBody);
			process.exit(1);
		}

		console.log("✅ invalid lat → 400 InvalidDiscoverNearFilter");

		const near = await fetch(
			`${baseUrl}/api/user/establishments?lat=${BARCELONA_LAT}&lng=${BARCELONA_LNG}&radiusKm=50&limit=20`,
			{ headers },
		);
		const nearBody = (await near.json()) as {
			establishments?: {
				slug: string;
				distanceKm?: number;
			}[];
		};

		if (!near.ok || !Array.isArray(nearBody.establishments)) {
			console.error("❌ GET near:", near.status, nearBody);
			process.exit(1);
		}

		const demoRow = nearBody.establishments.find((row) => row.slug === "cafe-demo");

		if (!demoRow || typeof demoRow.distanceKm !== "number") {
			console.error("❌ demo tenant missing from near results with distanceKm", nearBody);
			process.exit(1);
		}

		if (demoRow.distanceKm < 0 || demoRow.distanceKm > 5) {
			console.error("❌ demo tenant distanceKm out of expected range", demoRow.distanceKm);
			process.exit(1);
		}

		console.log(`✅ near filter returns cafe-demo with distanceKm=${demoRow.distanceKm}`);

		const tagged = await fetch(
			`${baseUrl}/api/user/establishments?lat=${BARCELONA_LAT}&lng=${BARCELONA_LNG}&radiusKm=50&tags=desayunos&limit=20`,
			{ headers },
		);
		const taggedBody = (await tagged.json()) as {
			establishments?: { slug: string; tags?: string[] }[];
		};

		if (!tagged.ok || !Array.isArray(taggedBody.establishments)) {
			console.error("❌ GET near + tags:", tagged.status, taggedBody);
			process.exit(1);
		}

		console.log("✅ near + tags query succeeds");

		const legacy = await fetch(`${baseUrl}/api/user/establishments?limit=5`, { headers });
		const legacyBody = (await legacy.json()) as {
			establishments?: { slug: string; distanceKm?: number }[];
		};

		if (
			!legacy.ok ||
			!Array.isArray(legacyBody.establishments) ||
			legacyBody.establishments.some((row) => row.distanceKm !== undefined)
		) {
			console.error("❌ legacy list should omit distanceKm", legacy.status, legacyBody);
			process.exit(1);
		}

		console.log("✅ legacy list without near params");
		console.log("✅ verify:discover-establishments-near passed");
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
