/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { prisma } from "../src/lib/prisma";
import {
	brandingVerifyBaseUrl,
	ensureDemoTenantActive,
	loginOwnerForBrandingVerify,
} from "./lib/tenant-branding-verify-helpers";

/**
 * E2E umbrella: owner branding API + GET /api/me + Prisma assertion.
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
		tenant?: { id: string; primaryColor: string };
		role?: string;
	};

	if (!meBefore.ok || meBeforeBody.role !== "owner" || !meBeforeBody.tenant?.id) {
		console.error("❌ GET /api/me (owner):", meBefore.status, meBeforeBody);
		process.exit(1);
	}

	const tenantId = meBeforeBody.tenant.id;
	const originalColor = meBeforeBody.tenant.primaryColor;
	const newColor = originalColor === "#123456" ? "#654321" : "#123456";

	console.log("✅ GET /api/me (owner)");

	const invalidPatch = await fetch(`${brandingVerifyBaseUrl}/api/tenant/branding`, {
		method: "PATCH",
		headers,
		body: JSON.stringify({ primaryColor: "red" }),
	});
	const invalidBody = (await invalidPatch.json()) as { error?: { type?: string } };

	if (invalidPatch.status !== 400 || invalidBody.error?.type !== "InvalidTenantBranding") {
		console.error("❌ PATCH invalid color:", invalidPatch.status, invalidBody);
		process.exit(1);
	}

	console.log("✅ PATCH invalid color → 400 InvalidTenantBranding");

	const patch = await fetch(`${brandingVerifyBaseUrl}/api/tenant/branding`, {
		method: "PATCH",
		headers,
		body: JSON.stringify({ primaryColor: newColor }),
	});
	const patchBody = (await patch.json()) as { tenant?: { primaryColor: string } };

	if (!patch.ok || patchBody.tenant?.primaryColor !== newColor) {
		console.error("❌ PATCH /api/tenant/branding:", patch.status, patchBody);
		process.exit(1);
	}

	console.log(`✅ PATCH /api/tenant/branding → ${newColor}`);

	const rowAfterPatch = await prisma.tenant.findUnique({
		where: { id: tenantId },
		select: { primaryColor: true },
	});

	if (!rowAfterPatch || rowAfterPatch.primaryColor !== newColor) {
		console.error("❌ Prisma tenant.primaryColor after PATCH:", rowAfterPatch);
		process.exit(1);
	}

	console.log("✅ Prisma tenant.primaryColor matches PATCH");

	const meAfter = await fetch(`${brandingVerifyBaseUrl}/api/me`, {
		headers: { cookie: headers.cookie },
	});
	const meAfterBody = (await meAfter.json()) as { tenant?: { primaryColor: string } };

	if (!meAfter.ok || meAfterBody.tenant?.primaryColor !== newColor) {
		console.error("❌ GET /api/me after PATCH:", meAfter.status, meAfterBody);
		process.exit(1);
	}

	console.log("✅ GET /api/me reflects updated primaryColor");

	const restore = await fetch(`${brandingVerifyBaseUrl}/api/tenant/branding`, {
		method: "PATCH",
		headers,
		body: JSON.stringify({ primaryColor: originalColor }),
	});

	if (!restore.ok) {
		console.error("❌ PATCH restore original color:", restore.status);
		process.exit(1);
	}

	const rowRestored = await prisma.tenant.findUnique({
		where: { id: tenantId },
		select: { primaryColor: true },
	});

	if (!rowRestored || rowRestored.primaryColor !== originalColor) {
		console.error("❌ Prisma restore primaryColor:", rowRestored);
		process.exit(1);
	}

	console.log("✅ restored original primaryColor (API + Prisma)");
	console.log("✅ verify:tenant-branding passed");
}

void main();
