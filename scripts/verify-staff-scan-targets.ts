/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

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

type ScanTargetsResponse = {
	stampCampaigns?: {
		id: string;
		name: string;
		stampTypeLabel: string;
		requiredStamps: number;
	}[];
	promotions?: {
		id: string;
		title: string;
	}[];
};

/**
 * E2E: owner creates 2 campaigns (same stampTypeId) + Pro promo → GET scan/targets.
 * Employee GET OK; customer session → 401.
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

	const restorePlanId = meBody.tenant.subscriptionPlanId ?? PLAN_BASIC_ID;
	console.log("✅ GET /api/me (owner)");

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

	const typeLabel = `Scan targets type ${Date.now()}`;
	const createType = await fetch(`${brandingVerifyBaseUrl}/api/loyalty/stamp-types`, {
		method: "POST",
		headers: ownerHeaders,
		body: JSON.stringify({ label: typeLabel }),
	});
	const createTypeBody = (await createType.json()) as { stampType?: { id: string } };

	if (!createType.ok || !createTypeBody.stampType?.id) {
		console.error("❌ POST stamp-type:", createType.status, createTypeBody);
		process.exit(1);
	}

	const stampTypeId = createTypeBody.stampType.id;
	console.log("✅ POST stamp-type");

	const suffix = Date.now();
	const campaignNames = [`Targets A ${suffix}`, `Targets B ${suffix}`];
	const campaignIds: string[] = [];

	for (const name of campaignNames) {
		const createCampaign = await fetch(`${brandingVerifyBaseUrl}/api/loyalty/stamp-campaigns`, {
			method: "POST",
			headers: ownerHeaders,
			body: JSON.stringify({
				name,
				requiredStamps: name.startsWith("Targets A") ? 10 : 5,
				stampTypeId,
				visualTemplate: "coffee",
			}),
		});
		const createCampaignBody = (await createCampaign.json()) as {
			campaign?: { id: string; name: string };
		};

		if (!createCampaign.ok || !createCampaignBody.campaign?.id) {
			console.error("❌ POST stamp-campaign:", createCampaign.status, createCampaignBody);
			process.exit(1);
		}

		campaignIds.push(createCampaignBody.campaign.id);
	}

	console.log("✅ POST two stamp-campaigns (same stampTypeId)");

	const promoTitle = `Scan targets promo ${suffix}`;
	const createPromo = await fetch(`${brandingVerifyBaseUrl}/api/loyalty/promotions`, {
		method: "POST",
		headers: ownerHeaders,
		body: JSON.stringify({
			title: promoTitle,
			description: "10% descuento",
			type: "discount",
		}),
	});
	const createPromoBody = (await createPromo.json()) as { promotion?: { id: string } };

	if (!createPromo.ok || !createPromoBody.promotion?.id) {
		console.error("❌ POST promotion:", createPromo.status, createPromoBody);
		process.exit(1);
	}

	const promoId = createPromoBody.promotion.id;
	console.log("✅ POST active promotion");

	const ownerTargetsRes = await fetch(`${brandingVerifyBaseUrl}/api/loyalty/scan/targets`, {
		headers: { cookie: ownerHeaders.cookie ?? "" },
	});
	const ownerTargets = (await ownerTargetsRes.json()) as ScanTargetsResponse;

	if (!ownerTargetsRes.ok) {
		console.error("❌ GET scan/targets (owner):", ownerTargetsRes.status, ownerTargets);
		process.exit(1);
	}

	const matchingCampaigns =
		ownerTargets.stampCampaigns?.filter((campaign) => campaignIds.includes(campaign.id)) ?? [];

	if (matchingCampaigns.length !== 2) {
		console.error("❌ expected 2 created campaigns in targets", ownerTargets);
		process.exit(1);
	}

	if (
		!matchingCampaigns.every(
			(campaign) => campaign.stampTypeLabel === typeLabel && campaign.requiredStamps > 0,
		)
	) {
		console.error("❌ campaign target fields incomplete", matchingCampaigns);
		process.exit(1);
	}

	if (!ownerTargets.promotions?.some((promotion) => promotion.id === promoId)) {
		console.error("❌ active promo missing from targets", ownerTargets.promotions);
		process.exit(1);
	}

	console.log("✅ GET /api/loyalty/scan/targets (owner)");

	const employeeEmail = `scan-targets.employee.${suffix}@example.com`;
	const employeePassword = "temp-pass-scan-targets";
	const invite = await fetch(`${apexBaseUrl}/api/tenant/employees`, {
		method: "POST",
		headers: ownerHeaders,
		body: JSON.stringify({
			name: "Scan Targets Employee",
			email: employeeEmail,
			password: employeePassword,
		}),
	});

	if (invite.status !== 201) {
		console.error("❌ invite employee:", invite.status, await invite.json());
		process.exit(1);
	}

	const employeeLogin = await tenantFetch("/api/auth/login", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ email: employeeEmail, password: employeePassword }),
	});
	const employeeCookie = parseSetCookieSession(employeeLogin.headers.get("set-cookie"));

	if (employeeLogin.status !== 200 || !employeeCookie) {
		console.error("❌ employee login:", employeeLogin.status, await employeeLogin.json());
		process.exit(1);
	}

	const employeeTargetsRes = await fetch(`${brandingVerifyBaseUrl}/api/loyalty/scan/targets`, {
		headers: tenantHeaders({ cookie: `session=${employeeCookie}` }),
	});
	const employeeTargets = (await employeeTargetsRes.json()) as ScanTargetsResponse;

	if (!employeeTargetsRes.ok || !employeeTargets.stampCampaigns?.length) {
		console.error("❌ GET scan/targets (employee):", employeeTargetsRes.status, employeeTargets);
		process.exit(1);
	}

	console.log("✅ GET /api/loyalty/scan/targets (employee)");

	const customerRegister = await fetch(`${apexBaseUrl}/api/loyalty/customers/register`, {
		method: "POST",
		headers: tenantHeaders({ "Content-Type": "application/json" }),
		body: JSON.stringify({ name: "Scan Targets Customer" }),
	});
	const customerBody = (await customerRegister.json()) as { session?: { token?: string } };
	const customerCookie = parseSetCookieSession(customerRegister.headers.get("set-cookie"));

	if (customerRegister.status !== 201 || !customerCookie) {
		console.error("❌ customer register:", customerRegister.status, customerBody);
		process.exit(1);
	}

	const customerTargetsRes = await fetch(`${brandingVerifyBaseUrl}/api/loyalty/scan/targets`, {
		headers: tenantHeaders({ cookie: `session=${customerCookie}` }),
	});

	if (customerTargetsRes.status !== 401) {
		console.error("❌ customer GET scan/targets should be 401:", customerTargetsRes.status);
		process.exit(1);
	}

	console.log("✅ customer session GET scan/targets → 401");

	await fetch(`${brandingVerifyBaseUrl}/api/billing/tenant-plan`, {
		method: "PATCH",
		headers: ownerHeaders,
		body: JSON.stringify({ planId: restorePlanId }),
	});

	console.log("✅ verify:staff-scan-targets passed");
}

void main();
