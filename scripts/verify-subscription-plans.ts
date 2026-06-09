/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { DEMO_TENANT_ID } from "../src/lib/tenant/mockTenantBySlug";
import { prisma } from "../src/lib/prisma";
import {
	TENANT_ID_HEADER,
	TENANT_SLUG_HEADER,
} from "../src/lib/tenant/forwardResolvedTenantHeaders";
import {
	apexBaseUrl,
	ensureDemoTenantActive,
	parseSetCookieSession,
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

/**
 * E2E: owner lists plans → assigns pro → GET /api/me + Prisma; employee read-only; suspended blocked.
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

	const plansResponse = await fetch(`${brandingVerifyBaseUrl}/api/billing/plans`, {
		headers: ownerHeaders,
	});
	const plansBody = (await plansResponse.json()) as {
		plans?: { id: string; name: string; features?: { promotions?: boolean } }[];
	};

	if (plansResponse.status !== 200 || !plansBody.plans || plansBody.plans.length < 3) {
		console.error("❌ GET /api/billing/plans:", plansResponse.status, plansBody);
		process.exit(1);
	}

	const planNames = plansBody.plans.map((plan) => plan.name).sort();
	if (!planNames.includes("basic") || !planNames.includes("pro") || !planNames.includes("premium")) {
		console.error("❌ plans catalog missing basic/pro/premium:", planNames);
		process.exit(1);
	}

	const proPlan = plansBody.plans.find((plan) => plan.id === PLAN_PRO_ID);
	if (!proPlan || proPlan.features?.promotions !== true) {
		console.error("❌ pro plan features missing promotions:", proPlan);
		process.exit(1);
	}

	console.log("✅ GET /api/billing/plans → basic/pro/premium with features");

	const meBefore = await fetch(`${brandingVerifyBaseUrl}/api/me`, {
		headers: { cookie: ownerHeaders.cookie ?? "" },
	});
	const meBeforeBody = (await meBefore.json()) as {
		tenant?: { id: string; subscriptionPlan: string };
	};

	if (!meBefore.ok || !meBeforeBody.tenant?.id) {
		console.error("❌ GET /api/me before assign:", meBefore.status, meBeforeBody);
		process.exit(1);
	}

	const assign = await fetch(`${brandingVerifyBaseUrl}/api/billing/tenant-plan`, {
		method: "PATCH",
		headers: ownerHeaders,
		body: JSON.stringify({ planId: PLAN_PRO_ID }),
	});
	const assignBody = (await assign.json()) as {
		tenant?: { subscriptionPlan: string };
		plan?: { name: string; id: string };
	};

	if (
		assign.status !== 200 ||
		assignBody.plan?.id !== PLAN_PRO_ID ||
		assignBody.tenant?.subscriptionPlan !== "pro"
	) {
		console.error("❌ PATCH /api/billing/tenant-plan:", assign.status, assignBody);
		process.exit(1);
	}

	console.log("✅ PATCH /api/billing/tenant-plan → pro");

	const rowAfterAssign = await prisma.tenant.findUnique({
		where: { id: DEMO_TENANT_ID },
		select: { subscriptionPlan: true, subscriptionPlanId: true },
	});

	if (!rowAfterAssign || rowAfterAssign.subscriptionPlan !== "pro" || rowAfterAssign.subscriptionPlanId !== PLAN_PRO_ID) {
		console.error("❌ Prisma tenant plan after PATCH:", rowAfterAssign);
		process.exit(1);
	}

	console.log("✅ Prisma subscriptionPlanId + subscriptionPlan synced");

	const meAfter = await fetch(`${brandingVerifyBaseUrl}/api/me`, {
		headers: { cookie: ownerHeaders.cookie ?? "" },
	});
	const meAfterBody = (await meAfter.json()) as { tenant?: { subscriptionPlan: string } };

	if (!meAfter.ok || meAfterBody.tenant?.subscriptionPlan !== "pro") {
		console.error("❌ GET /api/me after assign:", meAfter.status, meAfterBody);
		process.exit(1);
	}

	console.log("✅ GET /api/me reflects assigned plan");

	const employeeEmail = `billing.employee.${Date.now()}@example.com`;
	const employeePassword = "temp-pass-verify-30";

	const invite = await fetch(`${apexBaseUrl}/api/tenant/employees`, {
		method: "POST",
		headers: ownerHeaders,
		body: JSON.stringify({
			name: "Billing Verify Employee",
			email: employeeEmail,
			password: employeePassword,
		}),
	});
	const inviteBody = (await invite.json()) as { employee?: { id: string; userId: string } };

	if (invite.status !== 201 || !inviteBody.employee?.userId) {
		console.error("❌ invite employee for billing verify:", invite.status, inviteBody);
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

	const employeePlans = await fetch(`${brandingVerifyBaseUrl}/api/billing/plans`, {
		headers: employeeHeaders,
	});

	if (employeePlans.status !== 200) {
		console.error("❌ employee GET /api/billing/plans:", employeePlans.status);
		process.exit(1);
	}

	console.log("✅ employee can GET /api/billing/plans");

	const employeePatch = await fetch(`${brandingVerifyBaseUrl}/api/billing/tenant-plan`, {
		method: "PATCH",
		headers: employeeHeaders,
		body: JSON.stringify({ planId: PLAN_BASIC_ID }),
	});
	const employeePatchBody = (await employeePatch.json()) as { error?: { type?: string } };

	if (employeePatch.status !== 403 || employeePatchBody.error?.type !== "TenantBillingForbidden") {
		console.error("❌ employee PATCH should be forbidden:", employeePatch.status, employeePatchBody);
		process.exit(1);
	}

	console.log("✅ employee blocked from PATCH /api/billing/tenant-plan");

	await prisma.tenant.update({
		where: { id: DEMO_TENANT_ID },
		data: { status: "suspended" },
	});

	const suspendedPatch = await fetch(`${brandingVerifyBaseUrl}/api/billing/tenant-plan`, {
		method: "PATCH",
		headers: ownerHeaders,
		body: JSON.stringify({ planId: PLAN_BASIC_ID }),
	});
	const suspendedPatchBody = (await suspendedPatch.json()) as { error?: { type?: string } };

	if (suspendedPatch.status !== 403 || suspendedPatchBody.error?.type !== "TenantAccessSuspended") {
		console.error("❌ suspended tenant PATCH should be 403:", suspendedPatch.status, suspendedPatchBody);
		process.exit(1);
	}

	console.log("✅ suspended tenant blocked from PATCH plan");

	await prisma.tenant.update({
		where: { id: DEMO_TENANT_ID },
		data: { status: "active" },
	});

	const restorePlanId = PLAN_BASIC_ID;
	await fetch(`${brandingVerifyBaseUrl}/api/billing/tenant-plan`, {
		method: "PATCH",
		headers: ownerHeaders,
		body: JSON.stringify({ planId: restorePlanId }),
	});

	await prisma.tenantMembership.delete({ where: { id: inviteBody.employee!.id } });
	await prisma.user.delete({ where: { id: inviteBody.employee!.userId } });

	console.log("✅ verify:subscription-plans passed");
}

void main();
