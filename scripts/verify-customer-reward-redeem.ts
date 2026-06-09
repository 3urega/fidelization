/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import {
	TENANT_ID_HEADER,
	TENANT_SLUG_HEADER,
} from "../src/lib/tenant/forwardResolvedTenantHeaders";
import { DEMO_TENANT_ID } from "../src/lib/tenant/mockTenantBySlug";
import { prisma } from "../src/lib/prisma";
import {
	apexBaseUrl,
	ensureDemoTenantActive,
	parseSetCookieSession,
	resolveTenantHostHeader,
	tenantFetch,
	tenantId,
	tenantSlug,
} from "./lib/customer-verify-helpers";

function tenantHeaders(extra: Record<string, string> = {}): Record<string, string> {
	return {
		[TENANT_ID_HEADER]: tenantId,
		[TENANT_SLUG_HEADER]: tenantSlug,
		...extra,
	};
}

type RewardRow = {
	id: string;
	name: string;
	costPoints: number;
	isActive: boolean;
};

/**
 * E2E: owner reward → register → scans → GET me rewards → redeem → reward_redeemed.
 */
async function main(): Promise<void> {
	if (!process.env.DATABASE_URL) {
		console.error("❌ DATABASE_URL required");
		process.exit(1);
	}

	await ensureDemoTenantActive();

	console.log(`   tenant host: ${resolveTenantHostHeader()} (Host on 127.0.0.1)`);

	await prisma.reward.updateMany({
		where: { tenantId: DEMO_TENANT_ID, name: { startsWith: "Verify reward redeem" } },
		data: { isActive: false },
	});

	const ownerLogin = await fetch(`${apexBaseUrl}/api/auth/demo`, { method: "POST" });
	const ownerCookie = parseSetCookieSession(ownerLogin.headers.get("set-cookie"));
	if (!ownerLogin.ok || !ownerCookie) {
		console.error("❌ owner demo login");
		process.exit(1);
	}

	const ownerHeaders = tenantHeaders({
		"Content-Type": "application/json",
		cookie: `session=${ownerCookie}`,
	});

	const rewardName = `Verify reward redeem ${Date.now()}`;
	const createReward = await fetch(`${apexBaseUrl}/api/loyalty/rewards`, {
		method: "POST",
		headers: ownerHeaders,
		body: JSON.stringify({
			name: rewardName,
			description: "Canje verify",
			costPoints: 3,
			type: "free_item",
		}),
	});
	const createRewardBody = (await createReward.json()) as {
		reward?: { id: string; isActive: boolean; costPoints: number };
	};

	if (
		!createReward.ok ||
		!createRewardBody.reward?.id ||
		!createRewardBody.reward.isActive ||
		createRewardBody.reward.costPoints !== 3
	) {
		console.error("❌ setup create reward:", createReward.status, createRewardBody);
		process.exit(1);
	}

	const rewardId = createRewardBody.reward.id;
	console.log("✅ setup active reward costPoints 3");

	const register = await tenantFetch("/api/loyalty/customers/register", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ name: "Reward Redeem Verify Customer" }),
	});
	const registerBody = (await register.json()) as {
		customer?: { id: string; qrValue: string };
		kind?: string;
	};
	const registerCookie = parseSetCookieSession(register.headers.get("set-cookie"));

	if (
		register.status !== 201 ||
		!registerCookie ||
		registerBody.kind !== "customer" ||
		!registerBody.customer?.id ||
		!registerBody.customer.qrValue
	) {
		console.error("❌ setup register customer:", register.status, registerBody);
		process.exit(1);
	}

	const customerId = registerBody.customer.id;
	const qrValue = registerBody.customer.qrValue;
	const customerCookie = `session=${registerCookie}`;
	console.log("✅ setup customer on tenant host");

	const meBeforePoints = await tenantFetch("/api/loyalty/me", {
		headers: { cookie: customerCookie },
	});
	const meBeforeBody = (await meBeforePoints.json()) as {
		customer?: { pointsBalance: number };
		rewards?: RewardRow[];
	};
	const rewardBefore = meBeforeBody.rewards?.find((row) => row.id === rewardId);

	if (
		meBeforePoints.status !== 200 ||
		meBeforeBody.customer?.pointsBalance !== 0 ||
		!rewardBefore ||
		rewardBefore.costPoints !== 3
	) {
		console.error("❌ GET /api/loyalty/me before scans:", meBeforePoints.status, meBeforeBody);
		process.exit(1);
	}

	console.log("✅ GET /api/loyalty/me → rewards[] with active reward");

	const insufficientRedeem = await tenantFetch("/api/loyalty/rewards/redeem", {
		method: "POST",
		headers: {
			cookie: customerCookie,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ rewardId }),
	});
	const insufficientBody = (await insufficientRedeem.json()) as { error?: { type?: string } };

	if (
		insufficientRedeem.status !== 400 ||
		insufficientBody.error?.type !== "InsufficientCustomerPoints"
	) {
		console.error("❌ redeem without points:", insufficientRedeem.status, insufficientBody);
		process.exit(1);
	}

	console.log("✅ POST redeem without points → 400 InsufficientCustomerPoints");

	for (let i = 0; i < 3; i += 1) {
		const scan = await fetch(`${apexBaseUrl}/api/loyalty/scan`, {
			method: "POST",
			headers: ownerHeaders,
			body: JSON.stringify({ qrValue }),
		});

		if (!scan.ok) {
			console.error(`❌ scan ${i + 1}/3:`, scan.status, await scan.json());
			process.exit(1);
		}
	}

	const meAfterScans = await tenantFetch("/api/loyalty/me", {
		headers: { cookie: customerCookie },
	});
	const meAfterScansBody = (await meAfterScans.json()) as {
		customer?: { pointsBalance: number };
	};

	if (meAfterScans.status !== 200 || meAfterScansBody.customer?.pointsBalance !== 3) {
		console.error("❌ GET /api/loyalty/me after scans:", meAfterScans.status, meAfterScansBody);
		process.exit(1);
	}

	console.log("✅ three scans → 3 points");

	const redeem = await tenantFetch("/api/loyalty/rewards/redeem", {
		method: "POST",
		headers: {
			cookie: customerCookie,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ rewardId }),
	});
	const redeemBody = (await redeem.json()) as {
		customer?: { pointsBalance: number };
		rewardId?: string;
	};

	if (
		redeem.status !== 200 ||
		redeemBody.rewardId !== rewardId ||
		redeemBody.customer?.pointsBalance !== 0
	) {
		console.error("❌ POST /api/loyalty/rewards/redeem:", redeem.status, redeemBody);
		process.exit(1);
	}

	console.log("✅ POST redeem → pointsBalance 0");

	const redeemTx = await prisma.loyaltyTransaction.findFirst({
		where: {
			tenantId: DEMO_TENANT_ID,
			customerId,
			type: "reward_redeemed",
			metadata: { path: ["rewardId"], equals: rewardId },
		},
	});

	if (!redeemTx || redeemTx.points !== 3) {
		console.error("❌ Prisma reward_redeemed:", redeemTx);
		process.exit(1);
	}

	console.log("✅ Prisma reward_redeemed row");

	const deactivate = await fetch(`${apexBaseUrl}/api/loyalty/rewards/${rewardId}`, {
		method: "PATCH",
		headers: ownerHeaders,
		body: JSON.stringify({ isActive: false }),
	});

	if (!deactivate.ok) {
		console.error("❌ deactivate reward:", deactivate.status);
		process.exit(1);
	}

	const meInactive = await tenantFetch("/api/loyalty/me", {
		headers: { cookie: customerCookie },
	});
	const meInactiveBody = (await meInactive.json()) as { rewards?: RewardRow[] };
	const inactiveRow = meInactiveBody.rewards?.find((row) => row.id === rewardId);

	if (meInactive.status !== 200 || inactiveRow) {
		console.error("❌ inactive reward should not appear in GET me:", meInactiveBody);
		process.exit(1);
	}

	console.log("✅ inactive reward hidden from GET me");

	await prisma.loyaltyTransaction.deleteMany({ where: { customerId } });
	await prisma.customer.delete({ where: { id: customerId } });
	await prisma.reward.update({
		where: { id: rewardId },
		data: { isActive: false },
	});

	console.log("✅ verify:customer-reward-redeem passed");
}

void main();
