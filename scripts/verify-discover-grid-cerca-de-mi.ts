/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { randomUUID } from "crypto";

import { DEFAULT_DISCOVER_NEAR_RADIUS_KM } from "../src/contexts/tenants/tenants/domain/DiscoverNearFilter";
import { prisma } from "../src/lib/prisma";
import { buildDiscoverEstablishmentsQuery, resolveDiscoverActiveNear } from "../src/lib/platform/buildDiscoverEstablishmentsQuery";
import { formatDistanceKm } from "../src/lib/platform/formatDistanceKm";
import {
	requestUserLocation,
	UserLocationError,
	type GeolocationProvider,
} from "../src/lib/platform/requestUserLocation";
import { DEMO_TENANT_ID } from "../src/lib/tenant/mockTenantBySlug";

const baseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000").replace(/\/$/, "");

const BARCELONA_LAT = 41.3874;
const BARCELONA_LNG = 2.1686;
const DEMO_LAT = 41.39;
const DEMO_LNG = 2.17;

function assertFormatDistanceKm(): void {
	const cases: Array<[number, string]> = [
		[0.3, "0,3 km"],
		[1.2, "1,2 km"],
		[10, "10,0 km"],
	];

	for (const [input, expected] of cases) {
		const actual = formatDistanceKm(input);
		if (actual !== expected) {
			console.error(`❌ formatDistanceKm(${input}) expected ${expected}, got ${actual}`);
			process.exit(1);
		}
	}

	console.log("✅ formatDistanceKm");
}

function assertBuildDiscoverEstablishmentsQuery(): void {
	const legacy = buildDiscoverEstablishmentsQuery({ offset: 0, limit: 6 });
	if (!legacy.includes("offset=0") || !legacy.includes("limit=6") || legacy.includes("lat=")) {
		console.error("❌ legacy query", legacy);
		process.exit(1);
	}

	const tagged = buildDiscoverEstablishmentsQuery({
		offset: 6,
		limit: 4,
		tags: ["desayunos", "brunch"],
	});
	if (!tagged.includes("tags=desayunos") || !tagged.includes("tags=brunch")) {
		console.error("❌ tagged query", tagged);
		process.exit(1);
	}

	const near = buildDiscoverEstablishmentsQuery({
		offset: 0,
		limit: 20,
		near: { latitude: BARCELONA_LAT, longitude: BARCELONA_LNG },
	});
	if (
		!near.includes(`lat=${BARCELONA_LAT}`) ||
		!near.includes(`lng=${BARCELONA_LNG}`) ||
		!near.includes(`radiusKm=${DEFAULT_DISCOVER_NEAR_RADIUS_KM}`)
	) {
		console.error("❌ near query", near);
		process.exit(1);
	}

	console.log("✅ buildDiscoverEstablishmentsQuery");
}

function assertResolveDiscoverActiveNear(): void {
	const zone = {
		label: "Terrassa, Barcelona",
		latitude: 41.5639,
		longitude: 2.0084,
	};
	const gps = { latitude: 41.39, longitude: 2.17 };

	const all = resolveDiscoverActiveNear({
		nearMeEnabled: false,
		gps: null,
		searchZone: null,
	});
	if (all.mode !== "all" || all.near !== undefined) {
		console.error("❌ expected all mode", all);
		process.exit(1);
	}

	const saved = resolveDiscoverActiveNear({
		nearMeEnabled: false,
		gps: null,
		searchZone: zone,
	});
	if (
		saved.mode !== "saved_zone" ||
		saved.near?.latitude !== zone.latitude ||
		saved.contextLabel !== zone.label
	) {
		console.error("❌ expected saved_zone", saved);
		process.exit(1);
	}

	const gpsLive = resolveDiscoverActiveNear({
		nearMeEnabled: true,
		gps,
		searchZone: zone,
	});
	if (
		gpsLive.mode !== "gps_live" ||
		gpsLive.near?.latitude !== gps.latitude ||
		gpsLive.near?.longitude !== gps.longitude
	) {
		console.error("❌ expected gps_live precedence over zone", gpsLive);
		process.exit(1);
	}

	const gpsWaiting = resolveDiscoverActiveNear({
		nearMeEnabled: true,
		gps: null,
		searchZone: zone,
	});
	if (gpsWaiting.mode !== "saved_zone") {
		console.error("❌ GPS enabled but not ready should fall back to zone", gpsWaiting);
		process.exit(1);
	}

	console.log("✅ resolveDiscoverActiveNear precedence");
}

async function assertRequestUserLocationMock(): Promise<void> {
	const successProvider: GeolocationProvider = {
		getCurrentPosition: async () => ({ latitude: 41.5, longitude: 2.1 }),
	};
	const success = await requestUserLocation(successProvider);
	if (success.latitude !== 41.5 || success.longitude !== 2.1) {
		console.error("❌ mock success location", success);
		process.exit(1);
	}

	const deniedProvider: GeolocationProvider = {
		getCurrentPosition: async () => {
			throw new UserLocationError("denied", "Location permission was denied.");
		},
	};

	try {
		await requestUserLocation(deniedProvider);
		console.error("❌ expected denied UserLocationError");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof UserLocationError) || error.code !== "denied") {
			console.error("❌ wrong denied error", error);
			process.exit(1);
		}
	}

	console.log("✅ requestUserLocation mock provider");
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

async function assertNearApiE2E(): Promise<void> {
	if (!process.env.DATABASE_URL) {
		console.error("❌ DATABASE_URL required for E2E");
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
		const email = `verify-grid-cerca-${randomUUID()}@example.local`;
		const password = "password123";

		const register = await fetch(`${baseUrl}/api/auth/register/user`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name: "Grid Cerca User", email, password }),
		});

		const userCookie = parseSessionCookie(register.headers.get("set-cookie"));
		if (register.status !== 201 || !userCookie) {
			console.error("❌ register user failed");
			process.exit(1);
		}

		const headers = { cookie: `session=${userCookie}` };
		const query = buildDiscoverEstablishmentsQuery({
			offset: 0,
			limit: 20,
			near: { latitude: BARCELONA_LAT, longitude: BARCELONA_LNG, radiusKm: 50 },
		});
		const response = await fetch(`${baseUrl}/api/user/establishments?${query}`, { headers });
		const body = (await response.json()) as {
			establishments?: { slug: string; distanceKm?: number }[];
		};

		if (!response.ok || !Array.isArray(body.establishments)) {
			console.error("❌ grid near API fetch:", response.status, body);
			process.exit(1);
		}

		const demoRow = body.establishments.find((row) => row.slug === "cafe-demo");
		if (!demoRow || typeof demoRow.distanceKm !== "number") {
			console.error("❌ cafe-demo with distanceKm missing", body);
			process.exit(1);
		}

		console.log(`✅ grid near API returns distanceKm=${demoRow.distanceKm} for cafe-demo`);
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
	assertFormatDistanceKm();
	assertBuildDiscoverEstablishmentsQuery();
	assertResolveDiscoverActiveNear();
	await assertRequestUserLocationMock();
	await assertNearApiE2E();
	console.log("✅ verify:discover-grid-cerca-de-mi passed");
}

void main();
