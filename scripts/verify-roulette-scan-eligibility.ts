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
import { DEMO_ROULETTE_CONFIG } from "../src/lib/roulette/demoRouletteConfig";
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

const pointsSpinConfig = {
	...DEMO_ROULETTE_CONFIG,
	segments: [
		{
			id: "00000000-0000-4000-8000-000000000801",
			label: "+10 puntos",
			weight: 100,
			prizeType: "points" as const,
			prize: { points: 10 },
			stockLimit: null,
			stockUsed: 0,
		},
		{
			id: "00000000-0000-4000-8000-000000000802",
			label: "Sin premio",
			weight: 1,
			prizeType: "none" as const,
			prize: {},
			stockLimit: null,
			stockUsed: 0,
		},
	],
	rules: {
		...DEMO_ROULETTE_CONFIG.rules,
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
	const email = `verify-roulette-eligibility-${randomUUID()}@example.local`;
	const password = "password123";

	const register = await fetch(`${apexBaseUrl}/api/auth/register/user`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ name: "Roulette Eligibility User", email, password }),
	});
	const registerBody = (await register.json()) as {
		user?: { id: string; qrValue: string | null };
	};
	const userCookie = parseSetCookieSession(register.headers.get("set-cookie"));

	if (
		register.status !== 201 ||
		!userCookie ||
		!registerBody.user?.qrValue
	) {
		console.error("❌ register user failed", register.status, registerBody);
		process.exit(1);
	}

	const userQrValue = registerBody.user.qrValue;
	const headers = { "Content-Type": "application/json", ...sessionHeaders(userCookie) };

	const join = await fetch(`${apexBaseUrl}/api/user/establishments/join`, {
		method: "POST",
		headers,
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
			config: pointsSpinConfig,
		},
		update: { isEnabled: true, config: pointsSpinConfig },
	});

	const lockedState = await fetch(
		`${apexBaseUrl}/api/user/establishments/${tenantSlug}/games/ruleta`,
		{ headers: sessionHeaders(userCookie) },
	);
	const lockedBody = (await lockedState.json()) as {
		canSpin?: boolean;
		isEnabled?: boolean;
		eligibility?: { expiresAt: string } | null;
	};

	if (!lockedState.ok || lockedBody.canSpin !== false || lockedBody.isEnabled !== true) {
		console.error("❌ ruleta should be enabled but locked before scan", lockedState.status, lockedBody);
		process.exit(1);
	}

	console.log("✅ GET ruleta locked before staff scan");

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

	const { expiresAt: firstExpiresAt } = await grantSpinEligibilityViaStaffScan(
		apexBaseUrl,
		ownerHeaders,
		userQrValue,
		"Scan eligibility verify",
	);
	console.log("✅ staff scan granted roulette eligibility");

	const unlockedState = await fetch(
		`${apexBaseUrl}/api/user/establishments/${tenantSlug}/games/ruleta`,
		{ headers: sessionHeaders(userCookie) },
	);
	const unlockedBody = (await unlockedState.json()) as {
		canSpin?: boolean;
		eligibility?: { expiresAt: string } | null;
	};

	if (
		!unlockedState.ok ||
		!unlockedBody.canSpin ||
		unlockedBody.eligibility?.expiresAt !== firstExpiresAt
	) {
		console.error("❌ ruleta should unlock after scan", unlockedState.status, unlockedBody);
		process.exit(1);
	}

	console.log("✅ GET ruleta canSpin true with expiresAt");

	const spin = await fetch(`${apexBaseUrl}/api/user/establishments/${tenantSlug}/games/ruleta/spin`, {
		method: "POST",
		headers: sessionHeaders(userCookie),
	});
	const spinBody = (await spin.json()) as { spinId?: string; prizeType?: string };

	if (!spin.ok || !spinBody.spinId || spinBody.prizeType !== "points") {
		console.error("❌ POST spin after eligibility", spin.status, spinBody);
		process.exit(1);
	}

	console.log("✅ POST spin consumes eligibility");

	const consumedState = await fetch(
		`${apexBaseUrl}/api/user/establishments/${tenantSlug}/games/ruleta`,
		{ headers: sessionHeaders(userCookie) },
	);
	const consumedBody = (await consumedState.json()) as { canSpin?: boolean; eligibility?: unknown };

	if (!consumedState.ok || consumedBody.canSpin !== false || consumedBody.eligibility !== null) {
		console.error("❌ ruleta locked after spin", consumedState.status, consumedBody);
		process.exit(1);
	}

	console.log("✅ GET ruleta locked after spin");

	const eligibilityRow = await prisma.rouletteSpinEligibility.findFirst({
		where: { tenantId: DEMO_TENANT_ID, customerId, consumedSpinId: spinBody.spinId },
	});

	if (!eligibilityRow?.consumedAt) {
		console.error("❌ prisma eligibility not consumed", eligibilityRow);
		process.exit(1);
	}

	console.log("✅ Prisma roulette_spin_eligibilities consumed");

	const { expiresAt: secondExpiresAt } = await grantSpinEligibilityViaStaffScan(
		apexBaseUrl,
		ownerHeaders,
		userQrValue,
		"Scan eligibility verify renew",
	);

	if (new Date(secondExpiresAt).getTime() <= new Date(firstExpiresAt).getTime()) {
		console.error("❌ second scan should renew expiry", firstExpiresAt, secondExpiresAt);
		process.exit(1);
	}

	const renewedState = await fetch(
		`${apexBaseUrl}/api/user/establishments/${tenantSlug}/games/ruleta`,
		{ headers: sessionHeaders(userCookie) },
	);
	const renewedBody = (await renewedState.json()) as { canSpin?: boolean };

	if (!renewedState.ok || !renewedBody.canSpin) {
		console.error("❌ ruleta should unlock again after second scan", renewedState.status, renewedBody);
		process.exit(1);
	}

	console.log("✅ second staff scan renews eligibility");

	await prisma.rouletteSpinEligibility.updateMany({
		where: { tenantId: DEMO_TENANT_ID, customerId, consumedAt: null },
		data: { expiresAt: new Date(Date.now() - 60_000) },
	});

	const expiredState = await fetch(
		`${apexBaseUrl}/api/user/establishments/${tenantSlug}/games/ruleta`,
		{ headers: sessionHeaders(userCookie) },
	);
	const expiredBody = (await expiredState.json()) as { canSpin?: boolean; eligibility?: unknown };

	if (!expiredState.ok || expiredBody.canSpin !== false || expiredBody.eligibility !== null) {
		console.error("❌ expired eligibility should lock ruleta", expiredState.status, expiredBody);
		process.exit(1);
	}

	console.log("✅ expired eligibility blocks canSpin");

	await prisma.tenant.update({
		where: { id: DEMO_TENANT_ID },
		data: { subscriptionPlanId: restorePlanId },
	});

	console.log("✅ verify:roulette-scan-eligibility passed");
}

void main();
