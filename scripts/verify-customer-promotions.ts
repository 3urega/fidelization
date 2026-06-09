/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import {
	TENANT_ID_HEADER,
	TENANT_SLUG_HEADER,
} from "../src/lib/tenant/forwardResolvedTenantHeaders";
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
import {
	brandingVerifyBaseUrl,
	loginOwnerForBrandingVerify,
} from "./lib/tenant-branding-verify-helpers";

const PLAN_BASIC_ID = "00000000-0000-4000-8000-000000000004";
const PLAN_PRO_ID = "00000000-0000-4000-8000-000000000006";

function tenantHeaders(extra: Record<string, string> = {}): Record<string, string> {
	return {
		[TENANT_ID_HEADER]: tenantId,
		[TENANT_SLUG_HEADER]: tenantSlug,
		...extra,
	};
}

type PromotionRow = {
	id: string;
	title: string;
	isActive: boolean;
};

type MeResponse = {
	promotions?: PromotionRow[];
	customer?: { id: string };
};

/**
 * E2E: Basic customer me promotions [] → assign Pro → owner promo → customer sees promo → deactivate → [].
 */
async function main(): Promise<void> {
	if (!process.env.DATABASE_URL) {
		console.error("❌ DATABASE_URL required");
		process.exit(1);
	}

	await ensureDemoTenantActive();

	console.log(`   tenant host: ${resolveTenantHostHeader()} (Host on 127.0.0.1)`);

	const ownerCookie = await loginOwnerForBrandingVerify();
	const ownerHeaders = tenantHeaders({
		cookie: `session=${ownerCookie}`,
		"Content-Type": "application/json",
	});

	const meOwner = await fetch(`${brandingVerifyBaseUrl}/api/me`, {
		headers: { cookie: ownerHeaders.cookie ?? "" },
	});
	const meOwnerBody = (await meOwner.json()) as {
		tenant?: { id: string; subscriptionPlanId: string | null };
	};

	if (!meOwner.ok || !meOwnerBody.tenant?.id) {
		console.error("❌ GET /api/me (owner):", meOwner.status, meOwnerBody);
		process.exit(1);
	}

	const demoTenantId = meOwnerBody.tenant.id;
	const restorePlanId = meOwnerBody.tenant.subscriptionPlanId ?? PLAN_BASIC_ID;

	await fetch(`${brandingVerifyBaseUrl}/api/billing/tenant-plan`, {
		method: "PATCH",
		headers: ownerHeaders,
		body: JSON.stringify({ planId: PLAN_BASIC_ID }),
	});
	console.log("✅ setup Basic tenant plan");

	const register = await tenantFetch("/api/loyalty/customers/register", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ name: "Customer Promotions Verify" }),
	});
	const registerBody = (await register.json()) as { kind?: string; customer?: { id: string } };
	const registerCookie = parseSetCookieSession(register.headers.get("set-cookie"));

	if (
		register.status !== 201 ||
		!registerCookie ||
		registerBody.kind !== "customer" ||
		!registerBody.customer?.id
	) {
		console.error("❌ setup register customer:", register.status, registerBody);
		process.exit(1);
	}

	const customerCookie = `session=${registerCookie}`;
	console.log("✅ setup customer on tenant host");

	const meBasic = await tenantFetch("/api/loyalty/me", {
		headers: { cookie: customerCookie },
	});
	const meBasicBody = (await meBasic.json()) as MeResponse;

	if (
		meBasic.status !== 200 ||
		!Array.isArray(meBasicBody.promotions) ||
		meBasicBody.promotions.length !== 0
	) {
		console.error("❌ Basic customer GET me should return promotions: []", meBasic.status, meBasicBody);
		process.exit(1);
	}
	console.log("✅ Basic customer GET /api/loyalty/me → promotions: []");

	const assignPro = await fetch(`${brandingVerifyBaseUrl}/api/billing/tenant-plan`, {
		method: "PATCH",
		headers: ownerHeaders,
		body: JSON.stringify({ planId: PLAN_PRO_ID }),
	});
	const assignProBody = (await assignPro.json()) as { tenant?: { subscriptionPlan: string } };

	if (!assignPro.ok || assignProBody.tenant?.subscriptionPlan !== "pro") {
		console.error("❌ PATCH tenant-plan → pro:", assignPro.status, assignProBody);
		process.exit(1);
	}
	console.log("✅ PATCH /api/billing/tenant-plan → pro");

	const promoTitle = `Verify customer promo ${Date.now()}`;
	const create = await fetch(`${brandingVerifyBaseUrl}/api/loyalty/promotions`, {
		method: "POST",
		headers: ownerHeaders,
		body: JSON.stringify({
			title: promoTitle,
			description: "2x1 en bebidas calientes",
			type: "discount",
		}),
	});
	const createBody = (await create.json()) as {
		promotion?: { id: string; title: string; isActive: boolean };
	};

	if (
		!create.ok ||
		!createBody.promotion?.id ||
		createBody.promotion.title !== promoTitle ||
		!createBody.promotion.isActive
	) {
		console.error("❌ POST /api/loyalty/promotions:", create.status, createBody);
		process.exit(1);
	}

	const promotionId = createBody.promotion.id;
	console.log(`✅ POST /api/loyalty/promotions → ${promotionId}`);

	const meWithPromo = await tenantFetch("/api/loyalty/me", {
		headers: { cookie: customerCookie },
	});
	const meWithPromoBody = (await meWithPromo.json()) as MeResponse;

	if (
		meWithPromo.status !== 200 ||
		!meWithPromoBody.promotions?.some(
			(promotion) => promotion.id === promotionId && promotion.title === promoTitle,
		)
	) {
		console.error("❌ customer GET me should include active promo:", meWithPromo.status, meWithPromoBody);
		process.exit(1);
	}
	console.log("✅ customer GET /api/loyalty/me includes active promo");

	const deactivate = await fetch(`${brandingVerifyBaseUrl}/api/loyalty/promotions/${promotionId}`, {
		method: "PATCH",
		headers: ownerHeaders,
		body: JSON.stringify({ isActive: false }),
	});
	const deactivateBody = (await deactivate.json()) as {
		promotion?: { id: string; isActive: boolean };
	};

	if (!deactivate.ok || deactivateBody.promotion?.isActive !== false) {
		console.error("❌ PATCH deactivate promotion:", deactivate.status, deactivateBody);
		process.exit(1);
	}
	console.log("✅ owner PATCH deactivate promotion");

	const meAfterDeactivate = await tenantFetch("/api/loyalty/me", {
		headers: { cookie: customerCookie },
	});
	const meAfterDeactivateBody = (await meAfterDeactivate.json()) as MeResponse;

	if (
		meAfterDeactivate.status !== 200 ||
		meAfterDeactivateBody.promotions?.some((promotion) => promotion.id === promotionId)
	) {
		console.error(
			"❌ customer GET me should not include deactivated promo:",
			meAfterDeactivate.status,
			meAfterDeactivateBody,
		);
		process.exit(1);
	}
	console.log("✅ customer GET /api/loyalty/me excludes deactivated promo");

	const row = await prisma.promotion.findFirst({
		where: { id: promotionId, tenantId: demoTenantId },
		select: { isActive: true, title: true },
	});

	if (!row || row.isActive || row.title !== promoTitle) {
		console.error("❌ Prisma promotion after deactivate:", row);
		process.exit(1);
	}
	console.log("✅ Prisma promotion matches deactivate");

	await fetch(`${brandingVerifyBaseUrl}/api/billing/tenant-plan`, {
		method: "PATCH",
		headers: ownerHeaders,
		body: JSON.stringify({ planId: restorePlanId }),
	});

	console.log("✅ verify:customer-promotions passed");
}

void main();
