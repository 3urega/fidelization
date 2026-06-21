/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

process.env.DISABLE_TENANT_PLAN_GATES = "0";

import { randomUUID } from "crypto";

import {
	TENANT_ID_HEADER,
	TENANT_SLUG_HEADER,
} from "../src/lib/tenant/forwardResolvedTenantHeaders";
import { RULETA_GAME_SLUG } from "../src/contexts/loyalty/games/domain/TenantGameActivation";
import { DEMO_TENANT_ID } from "../src/lib/tenant/mockTenantBySlug";
import { prisma } from "../src/lib/prisma";
import {
	apexBaseUrl,
	ensureDemoTenantActive,
	parseSetCookieSession,
	tenantId,
	tenantSlug,
} from "./lib/customer-verify-helpers";
import { grantSpinEligibilityViaStaffScan } from "./lib/staff-scan-verify-helpers";

const PLAN_BASIC_ID = "00000000-0000-4000-8000-000000000004";
const PLAN_PREMIUM_ID = "00000000-0000-4000-8000-000000000007";

const physicalSpinConfig = {
	version: 1,
	segments: [
		{
			id: "00000000-0000-4000-8000-000000000901",
			label: "Café gratis verify",
			weight: 100,
			prizeType: "physical" as const,
			prize: { description: "Café gratis verify" },
			stockLimit: null,
			stockUsed: 0,
		},
		{
			id: "00000000-0000-4000-8000-000000000902",
			label: "Sin premio",
			weight: 1,
			prizeType: "none" as const,
			prize: {},
			stockLimit: null,
			stockUsed: 0,
		},
	],
	rules: {
		maxSpinsPerDay: 2,
		maxSpinsPerWeek: 5,
		eligibilityTtlHours: 24,
		trigger: "after_staff_scan" as const,
	},
};

function tenantHeaders(extra: Record<string, string> = {}): Record<string, string> {
	return {
		[TENANT_ID_HEADER]: tenantId,
		[TENANT_SLUG_HEADER]: tenantSlug,
		...extra,
	};
}

function sessionHeaders(session: string): Record<string, string> {
	return { cookie: `session=${session}` };
}

async function main(): Promise<void> {
	if (!process.env.DATABASE_URL) {
		console.error("❌ DATABASE_URL required");
		process.exit(1);
	}

	await ensureDemoTenantActive();

	const tenant = await prisma.tenant.findFirst({
		where: { id: DEMO_TENANT_ID },
		select: { id: true, subscriptionPlanId: true },
	});

	if (!tenant) {
		console.error("❌ demo tenant not found");
		process.exit(1);
	}

	const restorePlanId = tenant.subscriptionPlanId ?? PLAN_BASIC_ID;
	const email = `verify-roulette-redeem-${randomUUID()}@example.local`;
	const password = "password123";

	const register = await fetch(`${apexBaseUrl}/api/auth/register/user`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ name: "Roulette Redeem User", email, password }),
	});
	const registerBody = (await register.json()) as {
		user?: { qrValue: string | null };
	};
	const userCookie = parseSetCookieSession(register.headers.get("set-cookie"));

	if (register.status !== 201 || !userCookie || !registerBody.user?.qrValue) {
		console.error("❌ register user failed", register.status, registerBody);
		process.exit(1);
	}

	const userQrValue = registerBody.user.qrValue;

	const join = await fetch(`${apexBaseUrl}/api/user/establishments/join`, {
		method: "POST",
		headers: { "Content-Type": "application/json", ...sessionHeaders(userCookie) },
		body: JSON.stringify({ slug: tenantSlug }),
	});
	const joinBody = (await join.json()) as { customer?: { id: string } };

	if ((join.status !== 200 && join.status !== 201) || !joinBody.customer?.id) {
		console.error("❌ join cafe-demo failed", join.status, joinBody);
		process.exit(1);
	}

	const customerId = joinBody.customer.id;
	console.log("✅ user joined cafe-demo");

	await prisma.tenant.update({
		where: { id: DEMO_TENANT_ID },
		data: { subscriptionPlanId: PLAN_PREMIUM_ID, subscriptionPlan: "premium" },
	});

	await prisma.tenantGameActivation.upsert({
		where: { tenantId_gameSlug: { tenantId: DEMO_TENANT_ID, gameSlug: RULETA_GAME_SLUG } },
		create: {
			tenantId: DEMO_TENANT_ID,
			gameSlug: RULETA_GAME_SLUG,
			isEnabled: true,
			config: physicalSpinConfig,
		},
		update: { isEnabled: true, config: physicalSpinConfig },
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

	await grantSpinEligibilityViaStaffScan(
		apexBaseUrl,
		ownerHeaders,
		userQrValue,
		"Staff redeem verify",
	);

	console.log("✅ staff scan granted eligibility");

	const spin = await fetch(`${apexBaseUrl}/api/user/establishments/${tenantSlug}/games/ruleta/spin`, {
		method: "POST",
		headers: sessionHeaders(userCookie),
	});
	const spinBody = (await spin.json()) as {
		spinId?: string;
		prizeType?: string;
		status?: string;
	};

	if (
		!spin.ok ||
		!spinBody.spinId ||
		spinBody.prizeType !== "physical" ||
		spinBody.status !== "pending_redeem"
	) {
		console.error("❌ user spin should win physical prize", spin.status, spinBody);
		process.exit(1);
	}

	const spinId = spinBody.spinId;
	console.log("✅ user won physical prize pending_redeem");

	const pending = await fetch(
		`${apexBaseUrl}/api/loyalty/games/ruleta/spins/pending?qrValue=${encodeURIComponent(userQrValue)}`,
		{ headers: ownerHeaders },
	);
	const pendingBody = (await pending.json()) as {
		customerId?: string;
		pendingSpins?: { spinId: string }[];
	};

	if (
		!pending.ok ||
		pendingBody.customerId !== customerId ||
		pendingBody.pendingSpins?.length !== 1 ||
		pendingBody.pendingSpins[0]?.spinId !== spinId
	) {
		console.error("❌ GET pending spins", pending.status, pendingBody);
		process.exit(1);
	}

	console.log("✅ GET pending spins by customer QR");

	const redeem = await fetch(`${apexBaseUrl}/api/loyalty/games/ruleta/spins/${spinId}/redeem`, {
		method: "POST",
		headers: ownerHeaders,
	});
	const redeemBody = (await redeem.json()) as {
		status?: string;
		redeemedAt?: string;
	};

	if (!redeem.ok || redeemBody.status !== "applied" || !redeemBody.redeemedAt) {
		console.error("❌ POST redeem", redeem.status, redeemBody);
		process.exit(1);
	}

	console.log("✅ POST redeem marks spin applied");

	const spinRow = await prisma.rouletteSpin.findFirst({
		where: { id: spinId, tenantId: DEMO_TENANT_ID, customerId },
	});

	if (!spinRow || spinRow.status !== "applied" || !spinRow.redeemedAt) {
		console.error("❌ prisma spin not redeemed", spinRow);
		process.exit(1);
	}

	console.log("✅ Prisma roulette_spins redeemed");

	const secondRedeem = await fetch(`${apexBaseUrl}/api/loyalty/games/ruleta/spins/${spinId}/redeem`, {
		method: "POST",
		headers: ownerHeaders,
	});
	const secondBody = (await secondRedeem.json()) as { error?: { type?: string } };

	if (secondRedeem.status !== 409 || secondBody.error?.type !== "RouletteSpinAlreadyRedeemed") {
		console.error("❌ second redeem should be idempotent error", secondRedeem.status, secondBody);
		process.exit(1);
	}

	console.log("✅ second redeem blocked");

	const emptyPending = await fetch(
		`${apexBaseUrl}/api/loyalty/games/ruleta/spins/pending?qrValue=${encodeURIComponent(userQrValue)}`,
		{ headers: ownerHeaders },
	);
	const emptyBody = (await emptyPending.json()) as { pendingSpins?: unknown[] };

	if (!emptyPending.ok || (emptyBody.pendingSpins?.length ?? 0) !== 0) {
		console.error("❌ pending list should be empty after redeem", emptyPending.status, emptyBody);
		process.exit(1);
	}

	console.log("✅ pending list empty after redeem");

	const userRedeem = await fetch(`${apexBaseUrl}/api/loyalty/games/ruleta/spins/${spinId}/redeem`, {
		method: "POST",
		headers: sessionHeaders(userCookie),
	});
	const userRedeemBody = (await userRedeem.json()) as { error?: { type?: string } };

	if (userRedeem.status !== 403 || userRedeemBody.error?.type !== "RouletteStaffForbidden") {
		console.error("❌ platform user cannot redeem", userRedeem.status, userRedeemBody);
		process.exit(1);
	}

	console.log("✅ platform user session blocked from redeem");

	await prisma.tenant.update({
		where: { id: DEMO_TENANT_ID },
		data: { subscriptionPlanId: restorePlanId },
	});

	console.log("✅ verify:roulette-staff-redeem passed");
}

void main();
