/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { prisma } from "../src/lib/prisma";
import {
	apexBaseUrl,
	ensureDemoTenantActive,
	parseSetCookieSession,
	tenantFetch,
	tenantId,
	tenantSlug,
} from "./lib/customer-verify-helpers";
import {
	TENANT_ID_HEADER,
	TENANT_SLUG_HEADER,
} from "../src/lib/tenant/forwardResolvedTenantHeaders";
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

/**
 * E2E: Basic 403 → assign Pro → owner POST/GET/PATCH + employee read-only + Prisma.
 * Requires dev server at NEXT_PUBLIC_API_URL and DATABASE_URL.
 */
async function main(): Promise<void> {
	if (!process.env.DATABASE_URL) {
		console.error("❌ DATABASE_URL required");
		process.exit(1);
	}

	await ensureDemoTenantActive();

	const ownerCookie = await loginOwnerForBrandingVerify();
	const ownerHeaders = tenantHeaders({
		cookie: `session=${ownerCookie}`,
		"Content-Type": "application/json",
	});

	const me = await fetch(`${brandingVerifyBaseUrl}/api/me`, {
		headers: { cookie: ownerHeaders.cookie ?? "" },
	});
	const meBody = (await me.json()) as {
		tenant?: { id: string; subscriptionPlanId: string | null };
		role?: string;
	};

	if (!me.ok || meBody.role !== "owner" || !meBody.tenant?.id) {
		console.error("❌ GET /api/me (owner):", me.status, meBody);
		process.exit(1);
	}

	const demoTenantId = meBody.tenant.id;
	const restorePlanId = meBody.tenant.subscriptionPlanId ?? PLAN_BASIC_ID;
	console.log("✅ GET /api/me (owner)");

	await fetch(`${brandingVerifyBaseUrl}/api/billing/tenant-plan`, {
		method: "PATCH",
		headers: ownerHeaders,
		body: JSON.stringify({ planId: PLAN_BASIC_ID }),
	});

	const basicGet = await fetch(`${brandingVerifyBaseUrl}/api/loyalty/promotions`, {
		headers: { cookie: ownerHeaders.cookie ?? "" },
	});
	const basicGetBody = (await basicGet.json()) as { error?: { type?: string } };

	if (basicGet.status !== 403 || basicGetBody.error?.type !== "PlanFeatureNotAvailable") {
		console.error("❌ GET promotions on Basic should be 403:", basicGet.status, basicGetBody);
		process.exit(1);
	}

	console.log("✅ Basic tenant GET /api/loyalty/promotions → 403 PlanFeatureNotAvailable");

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

	const invalidPost = await fetch(`${brandingVerifyBaseUrl}/api/loyalty/promotions`, {
		method: "POST",
		headers: ownerHeaders,
		body: JSON.stringify({ title: "", type: "discount" }),
	});
	const invalidBody = (await invalidPost.json()) as { error?: { type?: string } };

	if (invalidPost.status !== 400 || invalidBody.error?.type !== "InvalidPromotion") {
		console.error("❌ POST invalid promotion:", invalidPost.status, invalidBody);
		process.exit(1);
	}

	console.log("✅ POST invalid promotion → 400 InvalidPromotion");

	const promoTitle = `Verify promo ${Date.now()}`;
	const create = await fetch(`${brandingVerifyBaseUrl}/api/loyalty/promotions`, {
		method: "POST",
		headers: ownerHeaders,
		body: JSON.stringify({
			title: promoTitle,
			description: "10% en pasteles",
			type: "seasonal",
		}),
	});
	const createBody = (await create.json()) as {
		promotion?: {
			id: string;
			title: string;
			type: string;
			isActive: boolean;
		};
	};

	if (
		!create.ok ||
		!createBody.promotion?.id ||
		createBody.promotion.title !== promoTitle ||
		createBody.promotion.type !== "seasonal" ||
		!createBody.promotion.isActive
	) {
		console.error("❌ POST /api/loyalty/promotions:", create.status, createBody);
		process.exit(1);
	}

	const promotionId = createBody.promotion.id;
	console.log(`✅ POST /api/loyalty/promotions → ${promotionId}`);

	const rowAfterCreate = await prisma.promotion.findFirst({
		where: { id: promotionId, tenantId: demoTenantId },
		select: { title: true, type: true, isActive: true },
	});

	if (
		!rowAfterCreate ||
		rowAfterCreate.title !== promoTitle ||
		rowAfterCreate.type !== "seasonal" ||
		!rowAfterCreate.isActive
	) {
		console.error("❌ Prisma promotions after POST:", rowAfterCreate);
		process.exit(1);
	}

	console.log("✅ Prisma promotions matches POST");

	const list = await fetch(`${brandingVerifyBaseUrl}/api/loyalty/promotions`, {
		headers: { cookie: ownerHeaders.cookie ?? "" },
	});
	const listBody = (await list.json()) as {
		promotions?: { id: string; isActive: boolean }[];
	};

	if (
		!list.ok ||
		!listBody.promotions?.some((promotion) => promotion.id === promotionId && promotion.isActive)
	) {
		console.error("❌ GET /api/loyalty/promotions:", list.status, listBody);
		process.exit(1);
	}

	console.log("✅ GET /api/loyalty/promotions includes active promotion");

	const deactivate = await fetch(
		`${brandingVerifyBaseUrl}/api/loyalty/promotions/${promotionId}`,
		{
			method: "PATCH",
			headers: ownerHeaders,
			body: JSON.stringify({ isActive: false }),
		},
	);
	const deactivateBody = (await deactivate.json()) as {
		promotion?: { id: string; isActive: boolean };
	};

	if (!deactivate.ok || deactivateBody.promotion?.isActive !== false) {
		console.error("❌ PATCH deactivate:", deactivate.status, deactivateBody);
		process.exit(1);
	}

	console.log("✅ PATCH deactivate → isActive false");

	const rowAfterDeactivate = await prisma.promotion.findFirst({
		where: { id: promotionId, tenantId: demoTenantId },
		select: { isActive: true },
	});

	if (!rowAfterDeactivate || rowAfterDeactivate.isActive) {
		console.error("❌ Prisma isActive after PATCH:", rowAfterDeactivate);
		process.exit(1);
	}

	const employeeEmail = `promotions.employee.${Date.now()}@example.com`;
	const employeePassword = "temp-pass-verify-35";

	const invite = await fetch(`${apexBaseUrl}/api/tenant/employees`, {
		method: "POST",
		headers: ownerHeaders,
		body: JSON.stringify({
			name: "Promotions Verify Employee",
			email: employeeEmail,
			password: employeePassword,
		}),
	});
	const inviteBody = (await invite.json()) as { employee?: { id: string } };

	if (invite.status !== 201 || !inviteBody.employee?.id) {
		console.error("❌ invite employee:", invite.status, inviteBody);
		process.exit(1);
	}

	const employeeLogin = await tenantFetch("/api/auth/login", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ email: employeeEmail, password: employeePassword }),
	});
	const employeeCookie = parseSetCookieSession(employeeLogin.headers.get("set-cookie"));

	if (employeeLogin.status !== 200 || !employeeCookie) {
		console.error("❌ employee login:", employeeLogin.status);
		process.exit(1);
	}

	const employeeHeaders = tenantHeaders({
		cookie: `session=${employeeCookie}`,
		"Content-Type": "application/json",
	});

	const employeeGet = await fetch(`${brandingVerifyBaseUrl}/api/loyalty/promotions`, {
		headers: { cookie: employeeHeaders.cookie ?? "" },
	});

	if (employeeGet.status !== 200) {
		console.error("❌ employee GET /api/loyalty/promotions:", employeeGet.status);
		process.exit(1);
	}

	console.log("✅ employee GET /api/loyalty/promotions");

	const employeePost = await fetch(`${brandingVerifyBaseUrl}/api/loyalty/promotions`, {
		method: "POST",
		headers: employeeHeaders,
		body: JSON.stringify({ title: "Blocked", type: "discount" }),
	});
	const employeePostBody = (await employeePost.json()) as { error?: { type?: string } };

	if (employeePost.status !== 403 || employeePostBody.error?.type !== "PromotionForbidden") {
		console.error("❌ employee POST should be forbidden:", employeePost.status, employeePostBody);
		process.exit(1);
	}

	console.log("✅ employee blocked from POST /api/loyalty/promotions");

	await fetch(`${brandingVerifyBaseUrl}/api/billing/tenant-plan`, {
		method: "PATCH",
		headers: ownerHeaders,
		body: JSON.stringify({ planId: restorePlanId }),
	});

	console.log("✅ restored tenant plan");
	console.log("✅ verify:promotions passed");
}

void main();
