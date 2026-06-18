/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { hasTenantAddress } from "../src/lib/tenant/hasTenantAddress";
import { hasTenantGeolocation } from "../src/lib/tenant/hasTenantGeolocation";
import { hasTenantVerifiedLocation } from "../src/lib/tenant/hasTenantVerifiedLocation";
import {
	brandingVerifyBaseUrl,
	ensureDemoTenantActive,
	loginOwnerForBrandingVerify,
} from "./lib/tenant-branding-verify-helpers";

function assert(condition: boolean, message: string): void {
	if (!condition) {
		console.error(`❌ ${message}`);
		process.exit(1);
	}
}

function runUnitTests(): void {
	assert(!hasTenantAddress({ address: "" }), "empty address → false");
	assert(hasTenantAddress({ address: "Calle Mayor 1" }), "trimmed address → true");

	assert(!hasTenantGeolocation({ latitude: null, longitude: null }), "null coords → false");
	assert(
		hasTenantGeolocation({ latitude: 41.3874, longitude: 2.1686 }),
		"valid coords → true",
	);
	assert(
		!hasTenantGeolocation({ latitude: 41.3874, longitude: null }),
		"partial coords → false",
	);

	assert(
		!hasTenantVerifiedLocation({ address: "", latitude: 41.3874, longitude: 2.1686 }),
		"coords without address → false",
	);
	assert(
		!hasTenantVerifiedLocation({ address: "Calle 1", latitude: null, longitude: null }),
		"address without coords → false",
	);
	assert(
		hasTenantVerifiedLocation({
			address: "Calle Mayor 1, Barcelona",
			latitude: 41.3874,
			longitude: 2.1686,
		}),
		"address + coords → true",
	);

	console.log("✅ hasTenantAddress + hasTenantGeolocation + hasTenantVerifiedLocation unit tests");
}

async function runE2e(): Promise<void> {
	if (!process.env.DATABASE_URL) {
		console.error("❌ DATABASE_URL required for E2E smoke");
		process.exit(1);
	}

	if (!process.env.OWNER_VERIFY_EMAIL?.trim()) {
		await ensureDemoTenantActive();
	}

	const cookie = await loginOwnerForBrandingVerify();
	const me = await fetch(`${brandingVerifyBaseUrl}/api/me`, {
		headers: { cookie: `session=${cookie}` },
	});
	const meBody = (await me.json()) as {
		role?: string;
		tenant?: {
			address?: string;
			latitude?: number | null;
			longitude?: number | null;
		};
	};

	if (!me.ok || meBody.role !== "owner" || !meBody.tenant) {
		console.error("❌ GET /api/me (owner):", me.status, meBody);
		process.exit(1);
	}

	if (!("latitude" in meBody.tenant) || !("longitude" in meBody.tenant)) {
		console.error("❌ GET /api/me tenant missing latitude/longitude fields", meBody.tenant);
		process.exit(1);
	}

	const verified = hasTenantVerifiedLocation(meBody.tenant);
	const hasAddress = hasTenantAddress(meBody.tenant);
	const hasCoords = hasTenantGeolocation(meBody.tenant);

	if (verified && (!hasAddress || !hasCoords)) {
		console.error("❌ inconsistent verified location derivation", { verified, hasAddress, hasCoords });
		process.exit(1);
	}

	console.log(
		`✅ GET /api/me exposes coords (verified=${verified}, address=${hasAddress}, coords=${hasCoords})`,
	);
}

async function main(): Promise<void> {
	runUnitTests();
	await runE2e();
	console.log("\n✅ verify-tenant-geolocation-checklist passed");
}

void main();
