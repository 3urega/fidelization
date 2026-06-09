/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { prisma } from "../src/lib/prisma";
import {
	brandingVerifyBaseUrl,
	ensureDemoTenantActive,
	loginOwnerForBrandingVerify,
} from "./lib/tenant-branding-verify-helpers";

/**
 * E2E: owner rewards POST → GET → PATCH deactivate + Prisma assertion.
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

	const invalidPost = await fetch(`${brandingVerifyBaseUrl}/api/loyalty/rewards`, {
		method: "POST",
		headers,
		body: JSON.stringify({ name: "", costPoints: 0 }),
	});
	const invalidBody = (await invalidPost.json()) as { error?: { type?: string } };

	if (invalidPost.status !== 400 || invalidBody.error?.type !== "InvalidReward") {
		console.error("❌ POST invalid reward:", invalidPost.status, invalidBody);
		process.exit(1);
	}

	console.log("✅ POST invalid reward → 400 InvalidReward");

	const rewardName = `Verify reward ${Date.now()}`;
	const create = await fetch(`${brandingVerifyBaseUrl}/api/loyalty/rewards`, {
		method: "POST",
		headers,
		body: JSON.stringify({
			name: rewardName,
			description: "Un café de cortesía",
			costPoints: 50,
			type: "free_item",
		}),
	});
	const createBody = (await create.json()) as {
		reward?: {
			id: string;
			name: string;
			costPoints: number;
			type: string;
			isActive: boolean;
		};
	};

	if (
		!create.ok ||
		!createBody.reward?.id ||
		createBody.reward.name !== rewardName ||
		createBody.reward.costPoints !== 50 ||
		createBody.reward.type !== "free_item" ||
		!createBody.reward.isActive
	) {
		console.error("❌ POST /api/loyalty/rewards:", create.status, createBody);
		process.exit(1);
	}

	const rewardId = createBody.reward.id;
	console.log(`✅ POST /api/loyalty/rewards → ${rewardId}`);

	const rowAfterCreate = await prisma.reward.findFirst({
		where: { id: rewardId, tenantId },
		select: { name: true, costPoints: true, type: true, isActive: true },
	});

	if (
		!rowAfterCreate ||
		rowAfterCreate.name !== rewardName ||
		rowAfterCreate.costPoints !== 50 ||
		rowAfterCreate.type !== "free_item" ||
		!rowAfterCreate.isActive
	) {
		console.error("❌ Prisma rewards after POST:", rowAfterCreate);
		process.exit(1);
	}

	console.log("✅ Prisma rewards matches POST");

	const list = await fetch(`${brandingVerifyBaseUrl}/api/loyalty/rewards`, {
		headers: { cookie: headers.cookie },
	});
	const listBody = (await list.json()) as {
		rewards?: { id: string; isActive: boolean }[];
	};

	if (!list.ok || !listBody.rewards?.some((reward) => reward.id === rewardId && reward.isActive)) {
		console.error("❌ GET /api/loyalty/rewards:", list.status, listBody);
		process.exit(1);
	}

	console.log("✅ GET /api/loyalty/rewards includes active reward");

	const deactivate = await fetch(`${brandingVerifyBaseUrl}/api/loyalty/rewards/${rewardId}`, {
		method: "PATCH",
		headers,
		body: JSON.stringify({ isActive: false }),
	});
	const deactivateBody = (await deactivate.json()) as {
		reward?: { id: string; isActive: boolean };
	};

	if (!deactivate.ok || deactivateBody.reward?.isActive !== false) {
		console.error("❌ PATCH deactivate:", deactivate.status, deactivateBody);
		process.exit(1);
	}

	console.log("✅ PATCH deactivate → isActive false");

	const rowAfterDeactivate = await prisma.reward.findFirst({
		where: { id: rewardId, tenantId },
		select: { isActive: true },
	});

	if (!rowAfterDeactivate || rowAfterDeactivate.isActive) {
		console.error("❌ Prisma isActive after PATCH:", rowAfterDeactivate);
		process.exit(1);
	}

	const listAfterDeactivate = await fetch(`${brandingVerifyBaseUrl}/api/loyalty/rewards`, {
		headers: { cookie: headers.cookie },
	});
	const listAfterBody = (await listAfterDeactivate.json()) as {
		rewards?: { id: string; isActive: boolean }[];
	};
	const inactiveRow = listAfterBody.rewards?.find((reward) => reward.id === rewardId);

	if (!listAfterDeactivate.ok || !inactiveRow || inactiveRow.isActive) {
		console.error("❌ GET after deactivate should include inactive reward:", listAfterBody);
		process.exit(1);
	}

	console.log("✅ GET includes inactive reward after PATCH");
	console.log("✅ verify:rewards passed");
}

void main();
