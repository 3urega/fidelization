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
	parseSetCookieSession,
	tenantFetch,
	tenantId,
	tenantSlug,
} from "./lib/customer-verify-helpers";
import { findRouletteAuthGrantedOutcome } from "./lib/staff-scan-verify-helpers";
import {
	brandingVerifyBaseUrl,
	loginOwnerForBrandingVerify,
} from "./lib/tenant-branding-verify-helpers";
import {
	TENANT_ID_HEADER,
	TENANT_SLUG_HEADER,
} from "../src/lib/tenant/forwardResolvedTenantHeaders";

const PLAN_PREMIUM_ID = "00000000-0000-4000-8000-000000000007";

const detailVerifyConfig = {
	...DEMO_ROULETTE_CONFIG,
	rules: {
		...DEMO_ROULETTE_CONFIG.rules,
		maxSpinsInPeriod: 5,
		maxSpinsPerDay: 5,
	},
	segments: [
		{
			id: "00000000-0000-4000-8000-000000001165",
			label: "Detalle ficha ruleta",
			weight: 100,
			prizeType: "points",
			prize: { points: 10 },
			stockLimit: null,
			stockUsed: 0,
		},
		{
			id: "00000000-0000-4000-8000-000000001166",
			label: "Sin premio",
			weight: 1,
			prizeType: "none",
			prize: {},
			stockLimit: null,
			stockUsed: 0,
		},
	],
};

type DetailResponse = {
	id?: string;
	promotions?: { id: string; title: string; usedCount: number; maxUsesPerUser: number | null }[];
	rouletteSpins?: {
		id: string;
		segmentLabel: string;
		prizeType: string;
		status: string;
		createdAt: string;
	}[];
};

function tenantHeaders(extra: Record<string, string> = {}): Record<string, string> {
	return {
		[TENANT_ID_HEADER]: tenantId,
		[TENANT_SLUG_HEADER]: tenantSlug,
		...extra,
	};
}

function sessionHeaders(cookie: string): Record<string, string> {
	return { cookie: `session=${cookie}` };
}

async function registerUser(): Promise<{ cookie: string; qrValue: string }> {
	const email = `verify-detail-116-${randomUUID()}@example.local`;
	const password = "password123";

	const register = await fetch(`${apexBaseUrl}/api/auth/register/user`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ name: "Detail 116 User", email, password }),
	});
	const cookie = parseSetCookieSession(register.headers.get("set-cookie"));

	if (register.status !== 201 || !cookie) {
		console.error("❌ register user", register.status);
		process.exit(1);
	}

	const me = await fetch(`${apexBaseUrl}/api/user/me`, { headers: sessionHeaders(cookie) });
	const meBody = (await me.json()) as { user?: { qrValue?: string | null } };

	if (!me.ok || !meBody.user?.qrValue) {
		console.error("❌ user me qrValue", me.status);
		process.exit(1);
	}

	return { cookie, qrValue: meBody.user.qrValue };
}

/**
 * E2E: owner GET customer detail includes active promotion usage + roulette spin history.
 */
async function main(): Promise<void> {
	if (!process.env.DATABASE_URL) {
		console.error("❌ DATABASE_URL required");
		process.exit(1);
	}

	await ensureDemoTenantActive();

	const tenant = await prisma.tenant.findFirst({
		where: { id: DEMO_TENANT_ID },
		select: { subscriptionPlanId: true },
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
			config: detailVerifyConfig,
		},
		update: { isEnabled: true, config: detailVerifyConfig },
	});

	const ownerCookie = await loginOwnerForBrandingVerify();
	const ownerHeaders = tenantHeaders({
		cookie: `session=${ownerCookie}`,
		"Content-Type": "application/json",
	});

	const { cookie: userCookie, qrValue } = await registerUser();

	await fetch(`${apexBaseUrl}/api/user/establishments/join`, {
		method: "POST",
		headers: { "Content-Type": "application/json", ...sessionHeaders(userCookie) },
		body: JSON.stringify({ slug: tenantSlug }),
	});

	const establishment = await fetch(`${apexBaseUrl}/api/user/establishments/${tenantSlug}`, {
		headers: sessionHeaders(userCookie),
	});
	const establishmentBody = (await establishment.json()) as { customer?: { id: string } };

	if (!establishment.ok || !establishmentBody.customer?.id) {
		console.error("❌ establishment detail", establishment.status, establishmentBody);
		process.exit(1);
	}

	const customerId = establishmentBody.customer.id;

	await fetch(`${apexBaseUrl}/api/user/establishments/${tenantSlug}/games/ruleta/enroll`, {
		method: "POST",
		headers: sessionHeaders(userCookie),
	});

	const promoTitle = `Detail 116 promo ${Date.now()}`;
	const createPromo = await fetch(`${brandingVerifyBaseUrl}/api/loyalty/promotions`, {
		method: "POST",
		headers: ownerHeaders,
		body: JSON.stringify({
			title: promoTitle,
			description: "Verify customer detail promo section",
			type: "discount",
			maxUsesPerUser: 3,
		}),
	});
	const createPromoBody = (await createPromo.json()) as { promotion?: { id: string } };

	if (!createPromo.ok || !createPromoBody.promotion?.id) {
		console.error("❌ POST promotion", createPromo.status, createPromoBody);
		process.exit(1);
	}

	const promotionId = createPromoBody.promotion.id;

	const promoUse = await fetch(`${brandingVerifyBaseUrl}/api/loyalty/promotions/${promotionId}/use`, {
		method: "POST",
		headers: ownerHeaders,
		body: JSON.stringify({ qrValue }),
	});
	const promoUseBody = (await promoUse.json()) as {
		summary?: { usedCount: number };
		promotion?: { usedCount: number };
	};

	const usedAfterUse = promoUseBody.summary?.usedCount ?? promoUseBody.promotion?.usedCount;

	if (!promoUse.ok || usedAfterUse !== 1) {
		console.error("❌ POST promotion use", promoUse.status, promoUseBody);
		process.exit(1);
	}

	console.log("✅ promotion created and one use recorded");

	const scan = await tenantFetch("/api/loyalty/scan", {
		method: "POST",
		headers: ownerHeaders,
		body: JSON.stringify({
			qrValue,
			targetType: "roulette_authorize",
			purchaseAmountEuros: 15,
		}),
	});
	const scanBody = (await scan.json()) as { outcomes?: unknown[] };

	if (scan.status !== 200 || !findRouletteAuthGrantedOutcome(scanBody.outcomes)) {
		console.error("❌ staff roulette authorize", scan.status, scanBody);
		process.exit(1);
	}

	const spin = await fetch(`${apexBaseUrl}/api/user/establishments/${tenantSlug}/games/ruleta/spin`, {
		method: "POST",
		headers: sessionHeaders(userCookie),
	});
	const spinBody = (await spin.json()) as { spinId?: string };

	if (!spin.ok || !spinBody.spinId) {
		console.error("❌ client spin", spin.status, spinBody);
		process.exit(1);
	}

	console.log("✅ roulette spin recorded for customer");

	const detail = await fetch(`${brandingVerifyBaseUrl}/api/loyalty/customers/${customerId}`, {
		headers: { cookie: ownerHeaders.cookie ?? "" },
	});
	const detailBody = (await detail.json()) as DetailResponse;

	const promoRow = detailBody.promotions?.find((row) => row.id === promotionId);
	const spinRow = detailBody.rouletteSpins?.find((row) => row.id === spinBody.spinId);

	if (
		!detail.ok ||
		detailBody.id !== customerId ||
		!promoRow ||
		promoRow.usedCount !== 1 ||
		promoRow.maxUsesPerUser !== 3 ||
		!spinRow ||
		spinRow.segmentLabel.length < 1 ||
		spinRow.status !== "applied"
	) {
		console.error("❌ GET customer detail promos + ruleta:", detail.status, detailBody);
		process.exit(1);
	}

	console.log("✅ owner GET customer detail → promotions + rouletteSpins");

	await prisma.tenant.update({
		where: { id: DEMO_TENANT_ID },
		data: { subscriptionPlanId: restorePlanId },
	});

	console.log("✅ verify:customer-detail-promotions-roulette passed");
}

void main();
