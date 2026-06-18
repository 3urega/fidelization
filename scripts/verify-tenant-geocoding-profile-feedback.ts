/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { TENANT_GEOCODING_STATUS } from "../src/contexts/tenants/tenants/domain/TenantGeocodingStatus";
import {
	deriveTenantGeocodingDisplayState,
	displayStateFromPatchResponse,
} from "../src/lib/tenant/deriveTenantGeocodingDisplayState";
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
	const none = deriveTenantGeocodingDisplayState({ address: "", latitude: null, longitude: null });
	assert(none.variant === "none", "empty address → none");

	const noneWhitespace = deriveTenantGeocodingDisplayState({
		address: "   ",
		latitude: null,
		longitude: null,
	});
	assert(noneWhitespace.variant === "none", "whitespace address → none");

	const pending = deriveTenantGeocodingDisplayState({
		address: "Calle Falsa 123",
		latitude: null,
		longitude: null,
	});
	assert(pending.variant === "pending", "address without coords → pending");
	assert("showRetry" in pending && pending.showRetry === true, "pending shows retry");

	const confirmed = deriveTenantGeocodingDisplayState({
		address: "Plaça de Catalunya, Barcelona",
		latitude: 41.3874,
		longitude: 2.1686,
		geocodedAt: "2026-06-13T10:00:00.000Z",
	});
	assert(confirmed.variant === "confirmed", "address with coords → confirmed");
	assert(
		confirmed.variant === "confirmed" && confirmed.message.includes("13/6/2026"),
		"confirmed message includes formatted date",
	);

	const okDisplay = displayStateFromPatchResponse(TENANT_GEOCODING_STATUS.Ok, "Ubicación confirmada en el mapa.");
	assert(okDisplay?.variant === "confirmed", "patch ok → confirmed");

	const failedDisplay = displayStateFromPatchResponse(TENANT_GEOCODING_STATUS.Failed);
	assert(failedDisplay?.variant === "failed", "patch failed → failed");
	assert(
		failedDisplay?.variant === "failed" && failedDisplay.showRetry === true,
		"patch failed shows retry",
	);

	const clearedDisplay = displayStateFromPatchResponse(TENANT_GEOCODING_STATUS.Cleared);
	assert(clearedDisplay?.variant === "cleared", "patch cleared → cleared");

	const skippedDisplay = displayStateFromPatchResponse(TENANT_GEOCODING_STATUS.Skipped);
	assert(skippedDisplay === null, "patch skipped → null (no banner change)");

	console.log("✅ deriveTenantGeocodingDisplayState + displayStateFromPatchResponse unit tests");
}

async function runE2e(): Promise<void> {
	if (!process.env.DATABASE_URL) {
		console.error("❌ DATABASE_URL required for E2E");
		process.exit(1);
	}

	if (!process.env.OWNER_VERIFY_EMAIL?.trim()) {
		await ensureDemoTenantActive();
	}

	const cookie = await loginOwnerForBrandingVerify();
	const headers = {
		cookie: `session=${cookie}`,
		"Content-Type": "application/json",
	};

	const meBefore = await fetch(`${brandingVerifyBaseUrl}/api/me`, {
		headers: { cookie: headers.cookie },
	});
	const meBeforeBody = (await meBefore.json()) as {
		tenant?: {
			address?: string;
			description?: string;
			discoveryTags?: string[];
		};
	};

	if (!meBefore.ok || !meBeforeBody.tenant) {
		console.error("❌ GET /api/me before PATCH:", meBefore.status, meBeforeBody);
		process.exit(1);
	}

	const originalAddress = meBeforeBody.tenant.address ?? "";
	const originalDescription = meBeforeBody.tenant.description ?? "";
	const originalTags = meBeforeBody.tenant.discoveryTags ?? [];
	const testAddress = `Verify Geocoding Feedback ${Date.now()} Calle 1, Barcelona`;
	const testDescription = "Feedback UI verify";

	const patch = await fetch(`${brandingVerifyBaseUrl}/api/tenant/profile`, {
		method: "PATCH",
		headers,
		body: JSON.stringify({
			address: testAddress,
			description: testDescription,
		}),
	});
	const patchBody = (await patch.json()) as {
		geocodingStatus?: string;
		geocodingMessage?: string;
	};

	if (!patch.ok || !patchBody.geocodingStatus) {
		console.error("❌ PATCH /api/tenant/profile:", patch.status, patchBody);
		process.exit(1);
	}

	if (patchBody.geocodingStatus === TENANT_GEOCODING_STATUS.Skipped) {
		console.error("❌ expected geocoding attempt on new address, got skipped", patchBody);
		process.exit(1);
	}

	const hasMapboxToken = Boolean(process.env.MAPBOX_ACCESS_TOKEN?.trim());
	const expectedStatus = hasMapboxToken ? TENANT_GEOCODING_STATUS.Ok : TENANT_GEOCODING_STATUS.Failed;

	if (patchBody.geocodingStatus !== expectedStatus) {
		console.error(`❌ expected geocodingStatus ${expectedStatus}`, patchBody);
		process.exit(1);
	}

	const patchDisplay = displayStateFromPatchResponse(
		patchBody.geocodingStatus as typeof TENANT_GEOCODING_STATUS.Ok,
		patchBody.geocodingMessage,
	);
	assert(patchDisplay !== null, "PATCH response maps to display state");

	console.log(`✅ PATCH /api/tenant/profile → geocodingStatus=${patchBody.geocodingStatus}`);

	const regeocode = await fetch(`${brandingVerifyBaseUrl}/api/tenant/profile/regeocode`, {
		method: "POST",
		headers: { cookie: headers.cookie },
	});
	const regeocodeBody = (await regeocode.json()) as { geocodingStatus?: string };

	if (!regeocode.ok || !regeocodeBody.geocodingStatus) {
		console.error("❌ POST /api/tenant/profile/regeocode:", regeocode.status, regeocodeBody);
		process.exit(1);
	}

	console.log(`✅ POST /api/tenant/profile/regeocode → geocodingStatus=${regeocodeBody.geocodingStatus}`);

	await fetch(`${brandingVerifyBaseUrl}/api/tenant/profile`, {
		method: "PATCH",
		headers,
		body: JSON.stringify({
			address: originalAddress,
			description: originalDescription,
			discoveryTags: originalTags,
		}),
	});

	console.log("✅ restored original profile");
}

async function main(): Promise<void> {
	runUnitTests();
	await runE2e();
	console.log("\n✅ verify-tenant-geocoding-profile-feedback passed");
}

void main();
