/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { prisma } from "../src/lib/prisma";
import {
	brandingVerifyBaseUrl,
	ensureDemoTenantActive,
	loginOwnerForBrandingVerify,
} from "./lib/tenant-branding-verify-helpers";

/**
 * E2E: owner stamp campaigns POST → GET → PATCH deactivate + Prisma assertion.
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

	const me = await fetch(`${brandingVerifyBaseUrl}/api/me`, {
		headers: { cookie: headers.cookie },
	});
	const meBody = (await me.json()) as {
		tenant?: { id: string };
		role?: string;
	};

	if (!me.ok || meBody.role !== "owner" || !meBody.tenant?.id) {
		console.error("❌ GET /api/me (owner):", me.status, meBody);
		process.exit(1);
	}

	const tenantId = meBody.tenant.id;
	console.log("✅ GET /api/me (owner)");

	const invalidPost = await fetch(`${brandingVerifyBaseUrl}/api/loyalty/stamp-campaigns`, {
		method: "POST",
		headers,
		body: JSON.stringify({ name: "", requiredStamps: 0 }),
	});
	const invalidBody = (await invalidPost.json()) as { error?: { type?: string } };

	if (invalidPost.status !== 400 || invalidBody.error?.type !== "InvalidStampCampaign") {
		console.error("❌ POST invalid campaign:", invalidPost.status, invalidBody);
		process.exit(1);
	}

	console.log("✅ POST invalid campaign → 400 InvalidStampCampaign");

	const campaignName = `Verify stamp ${Date.now()}`;
	const create = await fetch(`${brandingVerifyBaseUrl}/api/loyalty/stamp-campaigns`, {
		method: "POST",
		headers,
		body: JSON.stringify({ name: campaignName, requiredStamps: 8 }),
	});
	const createBody = (await create.json()) as {
		campaign?: { id: string; name: string; requiredStamps: number; isActive: boolean };
	};

	if (
		!create.ok ||
		!createBody.campaign?.id ||
		createBody.campaign.name !== campaignName ||
		createBody.campaign.requiredStamps !== 8 ||
		!createBody.campaign.isActive
	) {
		console.error("❌ POST /api/loyalty/stamp-campaigns:", create.status, createBody);
		process.exit(1);
	}

	const campaignId = createBody.campaign.id;
	console.log(`✅ POST /api/loyalty/stamp-campaigns → ${campaignId}`);

	const rowAfterCreate = await prisma.stampCampaign.findFirst({
		where: { id: campaignId, tenantId },
		select: { name: true, requiredStamps: true, isActive: true },
	});

	if (
		!rowAfterCreate ||
		rowAfterCreate.name !== campaignName ||
		rowAfterCreate.requiredStamps !== 8 ||
		!rowAfterCreate.isActive
	) {
		console.error("❌ Prisma stamp_campaigns after POST:", rowAfterCreate);
		process.exit(1);
	}

	console.log("✅ Prisma stamp_campaigns matches POST");

	const list = await fetch(`${brandingVerifyBaseUrl}/api/loyalty/stamp-campaigns`, {
		headers: { cookie: headers.cookie },
	});
	const listBody = (await list.json()) as {
		campaigns?: { id: string; isActive: boolean }[];
	};

	if (!list.ok || !listBody.campaigns?.some((c) => c.id === campaignId && c.isActive)) {
		console.error("❌ GET /api/loyalty/stamp-campaigns:", list.status, listBody);
		process.exit(1);
	}

	console.log("✅ GET /api/loyalty/stamp-campaigns includes active campaign");

	const deactivate = await fetch(
		`${brandingVerifyBaseUrl}/api/loyalty/stamp-campaigns/${campaignId}`,
		{
			method: "PATCH",
			headers,
			body: JSON.stringify({ isActive: false }),
		},
	);
	const deactivateBody = (await deactivate.json()) as {
		campaign?: { id: string; isActive: boolean };
	};

	if (!deactivate.ok || deactivateBody.campaign?.isActive !== false) {
		console.error("❌ PATCH deactivate:", deactivate.status, deactivateBody);
		process.exit(1);
	}

	console.log("✅ PATCH deactivate → isActive false");

	const rowAfterDeactivate = await prisma.stampCampaign.findFirst({
		where: { id: campaignId, tenantId },
		select: { isActive: true },
	});

	if (!rowAfterDeactivate || rowAfterDeactivate.isActive) {
		console.error("❌ Prisma isActive after PATCH:", rowAfterDeactivate);
		process.exit(1);
	}

	console.log("✅ Prisma isActive false after PATCH");
	console.log("✅ verify:stamp-campaigns passed");
}

void main();
