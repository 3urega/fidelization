/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { prisma } from "../src/lib/prisma";
import {
	buildTenantGeocodingStaticMapUrl,
	resolveStaticMapCredentials,
} from "../src/lib/tenant/buildTenantGeocodingStaticMapUrl";
import {
	parseSetCookieSession,
	resolveTenantHostHeader,
	tenantFetch,
} from "./lib/customer-verify-helpers";
import {
	brandingVerifyBaseUrl,
	ensureDemoTenantActive,
	loginOwnerForBrandingVerify,
} from "./lib/tenant-branding-verify-helpers";

const TEST_LAT = 41.3874;
const TEST_LNG = 2.1686;

function assert(condition: boolean, message: string): void {
	if (!condition) {
		console.error(`❌ ${message}`);
		process.exit(1);
	}
}

function runUnitTests(): void {
	const mapboxUrl = buildTenantGeocodingStaticMapUrl({
		latitude: TEST_LAT,
		longitude: TEST_LNG,
		provider: "mapbox",
		accessToken: "test-token",
	});
	assert(mapboxUrl.includes(`${TEST_LNG},${TEST_LAT}`), "Mapbox URL includes lng,lat");
	assert(mapboxUrl.includes("pin-l+"), "Mapbox URL includes pin overlay");
	assert(mapboxUrl.includes("access_token=test-token"), "Mapbox URL includes access token");

	const googleUrl = buildTenantGeocodingStaticMapUrl({
		latitude: TEST_LAT,
		longitude: TEST_LNG,
		provider: "google",
		accessToken: "google-test-key",
	});
	assert(googleUrl.includes("maps.googleapis.com/maps/api/staticmap"), "Google URL is staticmap endpoint");
	assert(googleUrl.includes(String(TEST_LAT)) && googleUrl.includes(String(TEST_LNG)), "Google URL includes coordinates");
	assert(googleUrl.includes("markers="), "Google URL includes markers");
	assert(googleUrl.includes("key=google-test-key"), "Google URL includes API key");

	const savedMapboxToken = process.env.MAPBOX_ACCESS_TOKEN;
	const savedGoogleKey = process.env.GOOGLE_MAPS_GEOCODING_API_KEY;
	const savedProvider = process.env.GEOCODING_PROVIDER;

	delete process.env.MAPBOX_ACCESS_TOKEN;
	delete process.env.GOOGLE_MAPS_GEOCODING_API_KEY;
	process.env.GEOCODING_PROVIDER = "mapbox";
	assert(resolveStaticMapCredentials() === null, "missing credentials → null");

	process.env.MAPBOX_ACCESS_TOKEN = savedMapboxToken;
	process.env.GOOGLE_MAPS_GEOCODING_API_KEY = savedGoogleKey;
	process.env.GEOCODING_PROVIDER = savedProvider;

	console.log("✅ buildTenantGeocodingStaticMapUrl + resolveStaticMapCredentials unit tests");
}

async function seedTenantCoordinates(tenantId: string): Promise<void> {
	await prisma.tenant.update({
		where: { id: tenantId },
		data: {
			latitude: TEST_LAT,
			longitude: TEST_LNG,
			geocodedAt: new Date(),
			geocodingProvider: "mapbox",
		},
	});
}

async function clearTenantCoordinates(tenantId: string): Promise<void> {
	await prisma.tenant.update({
		where: { id: tenantId },
		data: {
			latitude: null,
			longitude: null,
			geocodedAt: null,
			geocodingProvider: null,
		},
	});
}

async function runE2e(): Promise<void> {
	if (!process.env.DATABASE_URL) {
		console.error("❌ DATABASE_URL required for E2E");
		process.exit(1);
	}

	if (!process.env.OWNER_VERIFY_EMAIL?.trim()) {
		await ensureDemoTenantActive();
	}

	const ownerCookie = await loginOwnerForBrandingVerify();
	const ownerHeaders = {
		cookie: `session=${ownerCookie}`,
	};

	const me = await fetch(`${brandingVerifyBaseUrl}/api/me`, { headers: ownerHeaders });
	const meBody = (await me.json()) as { tenant?: { id: string }; role?: string };

	if (!me.ok || meBody.role !== "owner" || !meBody.tenant?.id) {
		console.error("❌ GET /api/me (owner):", me.status, meBody);
		process.exit(1);
	}

	const tenantId = meBody.tenant.id;
	const original = await prisma.tenant.findUnique({
		where: { id: tenantId },
		select: {
			address: true,
			description: true,
			discoveryTags: true,
			latitude: true,
			longitude: true,
			geocodedAt: true,
			geocodingProvider: true,
		},
	});

	await seedTenantCoordinates(tenantId);

	const previewWithCoords = await fetch(`${brandingVerifyBaseUrl}/api/tenant/geocoding-map-preview`, {
		headers: ownerHeaders,
	});

	if (previewWithCoords.status === 200) {
		const contentType = previewWithCoords.headers.get("content-type") ?? "";
		if (!contentType.startsWith("image/")) {
			console.error("❌ map preview 200 but not image:", contentType);
			process.exit(1);
		}

		console.log("✅ GET /api/tenant/geocoding-map-preview → 200 image");
	} else if (previewWithCoords.status === 503) {
		console.log("✅ GET /api/tenant/geocoding-map-preview → 503 (static map not configured on server)");
	} else {
		console.error("❌ unexpected map preview status with coords:", previewWithCoords.status);
		process.exit(1);
	}

	await clearTenantCoordinates(tenantId);

	const previewWithoutCoords = await fetch(
		`${brandingVerifyBaseUrl}/api/tenant/geocoding-map-preview`,
		{ headers: ownerHeaders },
	);

	if (previewWithoutCoords.status !== 404) {
		console.error("❌ expected 404 without coords:", previewWithoutCoords.status);
		process.exit(1);
	}

	console.log("✅ GET /api/tenant/geocoding-map-preview → 404 without coords");

	const employeeEmail = `map-preview.employee.${Date.now()}@example.com`;
	const employeePassword = "temp-pass-map-preview";
	const invite = await fetch(`${brandingVerifyBaseUrl}/api/tenant/employees`, {
		method: "POST",
		headers: {
			...ownerHeaders,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			name: "Map Preview Employee",
			email: employeeEmail,
			password: employeePassword,
		}),
	});

	if (!invite.ok) {
		console.error("❌ invite employee for map preview verify:", invite.status);
		process.exit(1);
	}

	await seedTenantCoordinates(tenantId);

	console.log(`   tenant host: ${resolveTenantHostHeader()} (Host on 127.0.0.1)`);

	const employeeLogin = await tenantFetch("/api/auth/login", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ email: employeeEmail, password: employeePassword }),
	});
	const employeeCookie = parseSetCookieSession(employeeLogin.headers.get("set-cookie"));

	if (employeeLogin.status !== 200 || !employeeCookie) {
		console.error("❌ employee login:", employeeLogin.status);
		process.exit(1);
	}

	const employeePreview = await tenantFetch("/api/tenant/geocoding-map-preview", {
		headers: { cookie: `session=${employeeCookie}` },
	});

	if (employeePreview.status !== 403) {
		console.error("❌ employee map preview should be 403:", employeePreview.status);
		process.exit(1);
	}

	console.log("✅ employee GET /api/tenant/geocoding-map-preview → 403");

	await prisma.tenant.update({
		where: { id: tenantId },
		data: {
			address: original?.address ?? "",
			description: original?.description ?? "",
			discoveryTags: original?.discoveryTags ?? [],
			latitude: original?.latitude ?? null,
			longitude: original?.longitude ?? null,
			geocodedAt: original?.geocodedAt ?? null,
			geocodingProvider: original?.geocodingProvider ?? null,
		},
	});

	console.log("✅ restored original tenant profile");
}

async function main(): Promise<void> {
	runUnitTests();
	await runE2e();
	console.log("\n✅ verify-tenant-geocoding-map-preview passed");
}

void main();
