/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { prisma } from "../src/lib/prisma";
import {
	brandingVerifyBaseUrl,
	ensureDemoTenantActive,
	loginOwnerForBrandingVerify,
} from "./lib/tenant-branding-verify-helpers";

/**
 * E2E: owner profile API + GET /api/me + Prisma assertion.
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
	const testAddress = "Verify Calle Perfil 42, Barcelona";
	const testDescription = "Perfil verify — café de prueba.";
	const testTags = ["desayunos", "cafe-autor"];

	console.log("✅ GET /api/me (owner)");

	const invalidPatch = await fetch(`${brandingVerifyBaseUrl}/api/tenant/profile`, {
		method: "PATCH",
		headers,
		body: JSON.stringify({}),
	});
	const invalidBody = (await invalidPatch.json()) as { error?: { type?: string } };

	if (invalidPatch.status !== 400 || invalidBody.error?.type !== "InvalidTenantProfile") {
		console.error("❌ PATCH empty body:", invalidPatch.status, invalidBody);
		process.exit(1);
	}

	console.log("✅ PATCH empty body → 400 InvalidTenantProfile");

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
		tenant?: { address: string; description: string; discoveryTags?: string[] };
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
		select: { address: true, description: true, discoveryTags: true },
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

	console.log("✅ Prisma tenant.address/description matches PATCH");

	const meAfter = await fetch(`${brandingVerifyBaseUrl}/api/me`, {
		headers: { cookie: headers.cookie },
	});
	const meAfterBody = (await meAfter.json()) as {
		tenant?: { address: string; description: string; discoveryTags?: string[] };
	};

	if (
		!meAfter.ok ||
		meAfterBody.tenant?.address !== testAddress ||
		meAfterBody.tenant?.description !== testDescription ||
		meAfterBody.tenant?.discoveryTags?.join(",") !== testTags.join(",")
	) {
		console.error("❌ GET /api/me after PATCH:", meAfter.status, meAfterBody);
		process.exit(1);
	}

	console.log("✅ GET /api/me reflects updated profile");

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
	console.log("\n✅ verify-tenant-profile passed");
}

void main();
