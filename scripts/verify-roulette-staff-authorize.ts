/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

process.env.DISABLE_TENANT_PLAN_GATES = "0";

import { randomUUID } from "crypto";

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
import { findRouletteAuthDeniedOutcome, findRouletteAuthGrantedOutcome } from "./lib/staff-scan-verify-helpers";
import { loginOwnerForBrandingVerify } from "./lib/tenant-branding-verify-helpers";
import {
	TENANT_ID_HEADER,
	TENANT_SLUG_HEADER,
} from "../src/lib/tenant/forwardResolvedTenantHeaders";

function tenantHeaders(extra: Record<string, string> = {}): Record<string, string> {
	return {
		[TENANT_ID_HEADER]: tenantId,
		[TENANT_SLUG_HEADER]: tenantSlug,
		...extra,
	};
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

const PLAN_PREMIUM_ID = "00000000-0000-4000-8000-000000000007";

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

async function registerUser(label: string): Promise<{ cookie: string; qrValue: string }> {
	const email = `verify-staff-auth-${label}-${randomUUID()}@example.local`;
	const password = "password123";

	const register = await fetch(`${apexBaseUrl}/api/auth/register/user`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ name: `Staff Auth ${label}`, email, password }),
	});
	const registerBody = (await register.json()) as {
		user?: { qrValue?: string | null };
	};
	const cookie = parseSessionCookie(register.headers.get("set-cookie"));

	if (register.status !== 201 || !cookie) {
		console.error("❌ register user failed", register.status, registerBody);
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

	await prisma.tenantGameActivation.upsert({
		where: { tenantId_gameSlug: { tenantId: DEMO_TENANT_ID, gameSlug: RULETA_GAME_SLUG } },
		create: {
			tenantId: DEMO_TENANT_ID,
			gameSlug: RULETA_GAME_SLUG,
			isEnabled: true,
			config: DEMO_ROULETTE_CONFIG,
		},
		update: { isEnabled: true, config: DEMO_ROULETTE_CONFIG },
	});

	const ownerCookie = await loginOwnerForBrandingVerify();
	const ownerHeaders = tenantHeaders(sessionHeaders(ownerCookie));

	const scanContext = await tenantFetch("/api/loyalty/games/ruleta/scan-context", {
		headers: ownerHeaders,
	});
	const scanContextBody = (await scanContext.json()) as {
		unlockEnabled?: boolean;
		authorizeEnabled?: boolean;
		minPurchaseEuros?: number | null;
	};

	if (
		scanContext.status !== 200 ||
		scanContextBody.unlockEnabled !== false ||
		scanContextBody.authorizeEnabled !== true ||
		scanContextBody.minPurchaseEuros !== DEMO_ROULETTE_CONFIG.rules.minPurchaseEuros
	) {
		console.error("❌ GET scan-context v2", scanContext.status, scanContextBody);
		process.exit(1);
	}

	console.log("✅ GET scan-context authorizeEnabled");

	const targets = await tenantFetch("/api/loyalty/scan/targets", { headers: ownerHeaders });
	const targetsBody = (await targets.json()) as {
		rouletteAuthorize?: { enabled?: boolean; minPurchaseEuros?: number | null };
	};

	if (
		targets.status !== 200 ||
		targetsBody.rouletteAuthorize?.enabled !== true ||
		targetsBody.rouletteAuthorize?.minPurchaseEuros !== DEMO_ROULETTE_CONFIG.rules.minPurchaseEuros
	) {
		console.error("❌ GET scan/targets rouletteAuthorize", targets.status, targetsBody);
		process.exit(1);
	}

	console.log("✅ GET scan/targets includes rouletteAuthorize");

	const enrolledUser = await registerUser("enrolled");
	await joinEstablishment(enrolledUser.cookie);
	await enrollUser(enrolledUser.cookie);

	const grantedScan = await postTenantStaffScan(ownerHeaders, {
		qrValue: enrolledUser.qrValue,
		targetType: "roulette_authorize",
		purchaseAmountEuros: 15,
	});
	const grantedOutcome = findRouletteAuthGrantedOutcome(
		grantedScan.body.outcomes as { kind: string; expiresAt?: string }[] | undefined,
	);

	if (grantedScan.status !== 200 || !grantedOutcome?.expiresAt) {
		console.error("❌ staff authorize granted", grantedScan.status, grantedScan.body);
		process.exit(1);
	}

	console.log("✅ POST scan roulette_authorize granted");

	const afterAuth = await fetch(
		`${apexBaseUrl}/api/user/establishments/${tenantSlug}/games/ruleta`,
		{ headers: sessionHeaders(enrolledUser.cookie) },
	);
	const afterAuthBody = (await afterAuth.json()) as { canSpin?: boolean; blockReason?: string };

	if (!afterAuth.ok || afterAuthBody.canSpin !== true) {
		console.error("❌ client canSpin after staff authorize", afterAuth.status, afterAuthBody);
		process.exit(1);
	}

	console.log("✅ staff authorize → client canSpin");

	const notEnrolledUser = await registerUser("not-enrolled");
	await joinEstablishment(notEnrolledUser.cookie);

	const deniedScan = await postTenantStaffScan(ownerHeaders, {
		qrValue: notEnrolledUser.qrValue,
		targetType: "roulette_authorize",
		purchaseAmountEuros: 15,
	});
	const deniedOutcomes = deniedScan.body.outcomes as
		| { kind: string; reasonCode?: string; message?: string }[]
		| undefined;
	const deniedOutcome = findRouletteAuthDeniedOutcome(deniedOutcomes);

	if (
		deniedScan.status !== 200 ||
		deniedOutcome?.reasonCode !== "not_enrolled" ||
		!deniedOutcome.message
	) {
		console.error("❌ not enrolled denied outcome", deniedScan.status, deniedScan.body);
		process.exit(1);
	}

	console.log("✅ roulette_auth_denied not_enrolled");

	const minPurchaseUser = await registerUser("min-purchase");
	await joinEstablishment(minPurchaseUser.cookie);
	await enrollUser(minPurchaseUser.cookie);

	const minDeniedScan = await postTenantStaffScan(ownerHeaders, {
		qrValue: minPurchaseUser.qrValue,
		targetType: "roulette_authorize",
		purchaseAmountEuros: 8,
	});
	const minDeniedOutcomes = minDeniedScan.body.outcomes as
		| { kind: string; reasonCode?: string; message?: string }[]
		| undefined;
	const minDeniedOutcome = findRouletteAuthDeniedOutcome(minDeniedOutcomes);

	if (
		minDeniedScan.status !== 200 ||
		minDeniedOutcome?.reasonCode !== "min_purchase" ||
		!minDeniedOutcome.message?.includes("10")
	) {
		console.error("❌ min purchase denied outcome", minDeniedScan.status, minDeniedScan.body);
		process.exit(1);
	}

	console.log("✅ roulette_auth_denied min_purchase");

	await prisma.tenant.update({
		where: { id: DEMO_TENANT_ID },
		data: { subscriptionPlanId: restorePlanId },
	});

	console.log("✅ verify:roulette-staff-authorize passed");
}

void main();
