/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { prisma } from "../src/lib/prisma";
import {
	brandingVerifyBaseUrl,
	ensureDemoTenantActive,
	loginOwnerForBrandingVerify,
} from "./lib/tenant-branding-verify-helpers";

/**
 * E2E: owner profile PATCH geocodes address when MAPBOX_ACCESS_TOKEN is set.
 * Requires dev server at NEXT_PUBLIC_API_URL and DATABASE_URL.
 */
async function main(): Promise<void> {
	if (!process.env.DATABASE_URL) {
		console.error("❌ DATABASE_URL required");
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
			id: string;
			address?: string;
			description?: string;
			discoveryTags?: string[];
			latitude?: number | null;
			longitude?: number | null;
		};
		role?: string;
	};

	if (!meBefore.ok || meBeforeBody.role !== "owner" || !meBeforeBody.tenant?.id) {
		console.error("❌ GET /api/me (owner):", meBefore.status, meBeforeBody);
		process.exit(1);
	}

	const tenantId = meBeforeBody.tenant.id;
	const originalAddress = meBeforeBody.tenant.address ?? "";
	const originalDescription = meBeforeBody.tenant.description ?? "";
	const originalTags = meBeforeBody.tenant.discoveryTags ?? [];
	const testAddress = "Plaça de Catalunya, Barcelona";
	const testDescription = "Geocoding verify — café de prueba.";
	const testTags = ["desayunos"];
	const hasMapboxToken = Boolean(process.env.MAPBOX_ACCESS_TOKEN?.trim());

	console.log("✅ GET /api/me (owner)");

	const patch = await fetch(`${brandingVerifyBaseUrl}/api/tenant/profile`, {
		method: "PATCH",
		headers,
		body: JSON.stringify({
			address: testAddress,
			description: testDescription,
			discoveryTags: testTags,
		}),
	});
	const patchBody = (await patch.json()) as {
		tenant?: {
			address: string;
			description: string;
			discoveryTags?: string[];
			latitude?: number | null;
			longitude?: number | null;
			geocodingProvider?: string | null;
			geocodedAt?: string | null;
		};
	};

	if (
		!patch.ok ||
		patchBody.tenant?.address !== testAddress ||
		patchBody.tenant?.description !== testDescription ||
		patchBody.tenant?.discoveryTags?.join(",") !== testTags.join(",")
	) {
		console.error("❌ PATCH /api/tenant/profile:", patch.status, patchBody);
		process.exit(1);
	}

	console.log("✅ PATCH /api/tenant/profile → address + description");

	const rowAfterPatch = await prisma.tenant.findUnique({
		where: { id: tenantId },
		select: {
			address: true,
			description: true,
			discoveryTags: true,
			latitude: true,
			longitude: true,
			geocodingProvider: true,
			geocodedAt: true,
		},
	});

	if (
		!rowAfterPatch ||
		rowAfterPatch.address !== testAddress ||
		rowAfterPatch.description !== testDescription ||
		JSON.stringify(rowAfterPatch.discoveryTags) !== JSON.stringify(testTags)
	) {
		console.error("❌ Prisma tenant profile after PATCH:", rowAfterPatch);
		process.exit(1);
	}

	if (hasMapboxToken) {
		if (rowAfterPatch.latitude === null || rowAfterPatch.longitude === null) {
			console.error("❌ expected coordinates with MAPBOX_ACCESS_TOKEN", rowAfterPatch);
			process.exit(1);
		}

		console.log(`✅ Prisma coords persisted (${rowAfterPatch.latitude}, ${rowAfterPatch.longitude})`);
	} else {
		if (rowAfterPatch.latitude !== null || rowAfterPatch.longitude !== null) {
			console.error("❌ without token coords should be null", rowAfterPatch);
			process.exit(1);
		}

		console.log("✅ without MAPBOX_ACCESS_TOKEN → address saved, coords null");
	}

	const descriptionOnlyPatch = await fetch(`${brandingVerifyBaseUrl}/api/tenant/profile`, {
		method: "PATCH",
		headers,
		body: JSON.stringify({ description: `${testDescription} updated` }),
	});

	if (!descriptionOnlyPatch.ok) {
		console.error("❌ PATCH description only:", descriptionOnlyPatch.status);
		process.exit(1);
	}

	const rowAfterDescriptionOnly = await prisma.tenant.findUnique({
		where: { id: tenantId },
		select: { latitude: true, longitude: true, geocodedAt: true },
	});

	if (
		hasMapboxToken &&
		(rowAfterDescriptionOnly?.latitude !== rowAfterPatch.latitude ||
			rowAfterDescriptionOnly?.longitude !== rowAfterPatch.longitude)
	) {
		console.error("❌ description-only PATCH should not re-geocode", rowAfterDescriptionOnly, rowAfterPatch);
		process.exit(1);
	}

	console.log("✅ description-only PATCH does not re-geocode");

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
	console.log("\n✅ verify-tenant-geocoding passed");
}

void main();
