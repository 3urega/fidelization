/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

process.env.DISABLE_TENANT_PLAN_GATES = "0";

import { randomUUID } from "crypto";

import type { RouletteConfigPrimitivesV2 } from "../src/contexts/loyalty/games/domain/RouletteConfig";
import { RULETA_GAME_SLUG } from "../src/contexts/loyalty/games/domain/TenantGameActivation";
import { DEMO_ROULETTE_CONFIG } from "../src/lib/roulette/demoRouletteConfig";
import { DEMO_TENANT_ID } from "../src/lib/tenant/mockTenantBySlug";
import { prisma } from "../src/lib/prisma";
import {
	apexBaseUrl,
	ensureDemoTenantActive,
	tenantFetch,
	tenantId,
	tenantSlug,
} from "./lib/customer-verify-helpers";
import {
	findRouletteAuthDeniedOutcome,
	findRouletteAuthGrantedOutcome,
} from "./lib/staff-scan-verify-helpers";
import { loginOwnerForBrandingVerify } from "./lib/tenant-branding-verify-helpers";
import {
	TENANT_ID_HEADER,
	TENANT_SLUG_HEADER,
} from "../src/lib/tenant/forwardResolvedTenantHeaders";

const PLAN_PREMIUM_ID = "00000000-0000-4000-8000-000000000007";

const flowE2eConfig: RouletteConfigPrimitivesV2 = {
	...DEMO_ROULETTE_CONFIG,
	segments: [
		{
			id: "00000000-0000-4000-8000-000000000f01",
			label: "+10 puntos flow e2e",
			weight: 100,
			prizeType: "points",
			prize: { points: 10 },
			stockLimit: null,
			stockUsed: 0,
		},
		{
			id: "00000000-0000-4000-8000-000000000f02",
			label: "Sin premio",
			weight: 1,
			prizeType: "none",
			prize: {},
			stockLimit: null,
			stockUsed: 0,
		},
	],
	rules: {
		...DEMO_ROULETTE_CONFIG.rules,
		maxSpinsInPeriod: 3,
		maxSpinsPerDay: 2,
	},
};

const quotaLimitedConfig: RouletteConfigPrimitivesV2 = {
	...flowE2eConfig,
	rules: {
		...flowE2eConfig.rules,
		maxSpinsInPeriod: 1,
		maxSpinsPerDay: 1,
	},
};

function tenantHeaders(extra: Record<string, string> = {}): Record<string, string> {
	return {
		[TENANT_ID_HEADER]: tenantId,
		[TENANT_SLUG_HEADER]: tenantSlug,
		...extra,
	};
}

function parseSessionCookie(setCookie: string | null): string | null {
	if (!setCookie) {
		return null;
	}

	const match = /session=([^;]+)/.exec(setCookie);

	return match?.[1] ?? null;
}

function sessionHeaders(session: string): Record<string, string> {
	return { cookie: `session=${session}` };
}

async function upsertRouletteConfig(config: RouletteConfigPrimitivesV2): Promise<void> {
	await prisma.tenantGameActivation.upsert({
		where: { tenantId_gameSlug: { tenantId: DEMO_TENANT_ID, gameSlug: RULETA_GAME_SLUG } },
		create: {
			tenantId: DEMO_TENANT_ID,
			gameSlug: RULETA_GAME_SLUG,
			isEnabled: true,
			config,
		},
		update: { isEnabled: true, config },
	});
}

async function postTenantStaffScan(
	ownerHeaders: Record<string, string>,
	body: Record<string, unknown>,
): Promise<{ status: number; body: Record<string, unknown> }> {
	const response = await tenantFetch("/api/loyalty/scan", {
		method: "POST",
		headers: { "Content-Type": "application/json", ...ownerHeaders },
		body: JSON.stringify(body),
	});

	return {
		status: response.status,
		body: (await response.json()) as Record<string, unknown>,
	};
}

async function registerUser(label: string): Promise<{ cookie: string; qrValue: string }> {
	const email = `verify-flow-e2e-${label}-${randomUUID()}@example.local`;
	const password = "password123";

	const register = await fetch(`${apexBaseUrl}/api/auth/register/user`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ name: `Flow E2E ${label}`, email, password }),
	});
	const cookie = parseSessionCookie(register.headers.get("set-cookie"));

	if (register.status !== 201 || !cookie) {
		console.error("❌ register user failed", register.status);
		process.exit(1);
	}

	const me = await fetch(`${apexBaseUrl}/api/user/me`, { headers: sessionHeaders(cookie) });
	const meBody = (await me.json()) as { user?: { qrValue?: string | null } };

	if (!me.ok || !meBody.user?.qrValue) {
		console.error("❌ GET /api/user/me qrValue", me.status, meBody);
		process.exit(1);
	}

	return { cookie, qrValue: meBody.user.qrValue };
}

async function joinEstablishment(userCookie: string): Promise<void> {
	const join = await fetch(`${apexBaseUrl}/api/user/establishments/join`, {
		method: "POST",
		headers: { "Content-Type": "application/json", ...sessionHeaders(userCookie) },
		body: JSON.stringify({ slug: tenantSlug }),
	});

	if (join.status !== 200 && join.status !== 201) {
		console.error("❌ join establishment failed", join.status);
		process.exit(1);
	}
}

async function enrollUser(userCookie: string): Promise<void> {
	const enroll = await fetch(
		`${apexBaseUrl}/api/user/establishments/${tenantSlug}/games/ruleta/enroll`,
		{ method: "POST", headers: sessionHeaders(userCookie) },
	);
	const body = (await enroll.json()) as { status?: string };

	if (!enroll.ok || body.status !== "active") {
		console.error("❌ POST enroll", enroll.status, body);
		process.exit(1);
	}
}

async function authorizeStaff(
	ownerHeaders: Record<string, string>,
	qrValue: string,
	purchaseAmountEuros: number,
): Promise<void> {
	const scan = await postTenantStaffScan(ownerHeaders, {
		qrValue,
		targetType: "roulette_authorize",
		purchaseAmountEuros,
	});
	const granted = findRouletteAuthGrantedOutcome(
		scan.body.outcomes as { kind: string; expiresAt?: string }[] | undefined,
	);

	if (scan.status !== 200 || !granted?.expiresAt) {
		console.error("❌ staff authorize", scan.status, scan.body);
		process.exit(1);
	}
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

	const restorePlanId = tenant.subscriptionPlanId;

	await prisma.tenant.update({
		where: { id: DEMO_TENANT_ID },
		data: { subscriptionPlanId: PLAN_PREMIUM_ID, subscriptionPlan: "premium" },
	});

	await upsertRouletteConfig(flowE2eConfig);

	const ownerCookie = await loginOwnerForBrandingVerify();
	const ownerHeaders = tenantHeaders(sessionHeaders(ownerCookie));

	const happyUser = await registerUser("happy");
	await joinEstablishment(happyUser.cookie);
	await enrollUser(happyUser.cookie);

	const detailBefore = await fetch(`${apexBaseUrl}/api/user/establishments/${tenantSlug}`, {
		headers: sessionHeaders(happyUser.cookie),
	});
	const detailBeforeBody = (await detailBefore.json()) as {
		customer?: { id: string; pointsBalance: number };
	};

	if (!detailBefore.ok || !detailBeforeBody.customer?.id) {
		console.error("❌ GET establishment detail before flow", detailBefore.status, detailBeforeBody);
		process.exit(1);
	}

	const customerId = detailBeforeBody.customer.id;
	const pointsBefore = detailBeforeBody.customer.pointsBalance;

	console.log("✅ user enrolled in ruleta");

	await authorizeStaff(ownerHeaders, happyUser.qrValue, 15);

	const lockedCheck = await fetch(
		`${apexBaseUrl}/api/user/establishments/${tenantSlug}/games/ruleta`,
		{ headers: sessionHeaders(happyUser.cookie) },
	);
	const lockedBody = (await lockedCheck.json()) as { canSpin?: boolean };

	if (!lockedCheck.ok || lockedBody.canSpin !== true) {
		console.error("❌ canSpin after authorize", lockedCheck.status, lockedBody);
		process.exit(1);
	}

	console.log("✅ staff authorize → client canSpin");

	const spin = await fetch(
		`${apexBaseUrl}/api/user/establishments/${tenantSlug}/games/ruleta/spin`,
		{ method: "POST", headers: sessionHeaders(happyUser.cookie) },
	);
	const spinBody = (await spin.json()) as {
		spinId?: string;
		segmentIndex?: number;
		prizeType?: string;
		prize?: { points?: number };
		status?: string;
	};

	if (
		!spin.ok ||
		!spinBody.spinId ||
		spinBody.prizeType !== "points" ||
		spinBody.prize?.points !== 10 ||
		typeof spinBody.segmentIndex !== "number"
	) {
		console.error("❌ POST spin happy path", spin.status, spinBody);
		process.exit(1);
	}

	console.log("✅ POST spin awards +10 points");

	const spinRow = await prisma.rouletteSpin.findFirst({
		where: { id: spinBody.spinId, tenantId: DEMO_TENANT_ID, customerId },
	});

	if (!spinRow || spinRow.segmentIndex !== spinBody.segmentIndex) {
		console.error("❌ prisma roulette_spins row", spinRow);
		process.exit(1);
	}

	console.log("✅ Prisma roulette_spins persisted");

	const detailAfter = await fetch(`${apexBaseUrl}/api/user/establishments/${tenantSlug}`, {
		headers: sessionHeaders(happyUser.cookie),
	});
	const detailAfterBody = (await detailAfter.json()) as {
		customer?: { pointsBalance: number };
	};

	if (!detailAfter.ok || detailAfterBody.customer?.pointsBalance !== pointsBefore + 10) {
		console.error("❌ points not applied after spin", detailAfter.status, detailAfterBody);
		process.exit(1);
	}

	console.log("✅ prize reflected in customer pointsBalance");

	await upsertRouletteConfig(quotaLimitedConfig);

	const quotaUser = await registerUser("quota");
	await joinEstablishment(quotaUser.cookie);
	await enrollUser(quotaUser.cookie);

	await authorizeStaff(ownerHeaders, quotaUser.qrValue, 15);

	const quotaSpin = await fetch(
		`${apexBaseUrl}/api/user/establishments/${tenantSlug}/games/ruleta/spin`,
		{ method: "POST", headers: sessionHeaders(quotaUser.cookie) },
	);
	const quotaSpinBody = (await quotaSpin.json()) as { spinId?: string };

	if (!quotaSpin.ok || !quotaSpinBody.spinId) {
		console.error("❌ quota user first spin", quotaSpin.status, quotaSpinBody);
		process.exit(1);
	}

	console.log("✅ quota user consumed single period spin");

	const quotaDeniedScan = await postTenantStaffScan(ownerHeaders, {
		qrValue: quotaUser.qrValue,
		targetType: "roulette_authorize",
		purchaseAmountEuros: 15,
	});
	const quotaDenied = findRouletteAuthDeniedOutcome(
		quotaDeniedScan.body.outcomes as
			| { kind: string; reasonCode?: string; message?: string }[]
			| undefined,
	);

	if (
		quotaDeniedScan.status !== 200 ||
		quotaDenied?.reasonCode !== "quota_exhausted" ||
		!quotaDenied.message
	) {
		console.error("❌ quota_exhausted denied outcome", quotaDeniedScan.status, quotaDeniedScan.body);
		process.exit(1);
	}

	console.log("✅ roulette_auth_denied quota_exhausted");

	await upsertRouletteConfig(DEMO_ROULETTE_CONFIG);
	await prisma.tenant.update({
		where: { id: DEMO_TENANT_ID },
		data: { subscriptionPlanId: restorePlanId },
	});

	console.log("✅ verify:roulette-participation-flow-e2e passed");
}

void main();
