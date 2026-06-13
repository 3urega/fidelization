/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import {
	TENANT_ID_HEADER,
	TENANT_SLUG_HEADER,
} from "../src/lib/tenant/forwardResolvedTenantHeaders";
import {
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

type InsightsResponse = {
	vipCount?: number;
	atRiskCount?: number;
	nearRewardCount?: number;
	newThisMonthCount?: number;
	generatedAt?: string;
	timezone?: string;
};

type ListResponse = {
	segment?: string;
	customers?: {
		id: string;
		name: string;
		status: string;
		visitsThisMonth: number;
		nearReward?: { current: number; required: number };
	}[];
	generatedAt?: string;
	timezone?: string;
};

type DetailResponse = {
	id?: string;
	name?: string;
	status?: string;
	stampProgress?: unknown[];
	recentActivity?: unknown[];
	rewardsRedeemed?: unknown[];
};

function tenantHeaders(extra: Record<string, string> = {}): Record<string, string> {
	return {
		[TENANT_ID_HEADER]: tenantId,
		[TENANT_SLUG_HEADER]: tenantSlug,
		...extra,
	};
}

function ownerCookieHeader(cookie: string): Record<string, string> {
	return { cookie: `session=${cookie}` };
}

/**
 * E2E: owner customer zone GET insights, list by segment, and detail.
 * Requires dev server at NEXT_PUBLIC_API_URL and DATABASE_URL.
 */
async function main(): Promise<void> {
	if (!process.env.DATABASE_URL) {
		console.error("❌ DATABASE_URL required");
		process.exit(1);
	}

	await ensureDemoTenantActive();

	const unauthenticated = await fetch(`${brandingVerifyBaseUrl}/api/loyalty/customers/insights`);
	if (unauthenticated.status !== 401) {
		console.error("❌ GET insights without session:", unauthenticated.status);
		process.exit(1);
	}

	console.log("✅ GET insights without session → 401");

	const ownerCookie = await loginOwnerForBrandingVerify();
	const ownerHeaders = tenantHeaders({
		cookie: `session=${ownerCookie}`,
		"Content-Type": "application/json",
	});

	const baselineInsights = await fetch(`${brandingVerifyBaseUrl}/api/loyalty/customers/insights`, {
		headers: ownerCookieHeader(ownerCookie),
	});
	const baselineInsightsBody = (await baselineInsights.json()) as InsightsResponse;

	if (
		!baselineInsights.ok ||
		typeof baselineInsightsBody.vipCount !== "number" ||
		!baselineInsightsBody.timezone
	) {
		console.error("❌ GET insights baseline:", baselineInsights.status, baselineInsightsBody);
		process.exit(1);
	}

	console.log("✅ GET insights baseline");

	const missingSegment = await fetch(`${brandingVerifyBaseUrl}/api/loyalty/customers`, {
		headers: ownerCookieHeader(ownerCookie),
	});
	const missingSegmentBody = (await missingSegment.json()) as { error?: { type?: string } };

	if (missingSegment.status !== 400 || missingSegmentBody.error?.type !== "InvalidCustomerZoneSegment") {
		console.error("❌ GET list without segment:", missingSegment.status, missingSegmentBody);
		process.exit(1);
	}

	console.log("✅ GET list without segment → 400");

	const invalidSegment = await fetch(
		`${brandingVerifyBaseUrl}/api/loyalty/customers?segment=invalid`,
		{ headers: ownerCookieHeader(ownerCookie) },
	);
	const invalidSegmentBody = (await invalidSegment.json()) as { error?: { type?: string } };

	if (invalidSegment.status !== 400 || invalidSegmentBody.error?.type !== "InvalidCustomerZoneSegment") {
		console.error("❌ GET list invalid segment:", invalidSegment.status, invalidSegmentBody);
		process.exit(1);
	}

	console.log("✅ GET list invalid segment → 400");

	const suffix = Date.now();
	const typeLabel = `Customer zone verify ${suffix}`;

	const createType = await fetch(`${brandingVerifyBaseUrl}/api/loyalty/stamp-types`, {
		method: "POST",
		headers: ownerHeaders,
		body: JSON.stringify({ label: typeLabel }),
	});
	const createTypeBody = (await createType.json()) as {
		stampType?: { id: string; label: string };
	};

	if (!createType.ok || !createTypeBody.stampType?.id) {
		console.error("❌ POST stamp type:", createType.status, createTypeBody);
		process.exit(1);
	}

	const stampTypeId = createTypeBody.stampType.id;
	const campaignName = `Customer zone campaign ${suffix}`;

	const createCampaign = await fetch(`${brandingVerifyBaseUrl}/api/loyalty/stamp-campaigns`, {
		method: "POST",
		headers: ownerHeaders,
		body: JSON.stringify({
			name: campaignName,
			requiredStamps: 10,
			stampTypeId,
		}),
	});
	const createCampaignBody = (await createCampaign.json()) as {
		campaign?: { id: string; isActive: boolean };
	};

	if (!createCampaign.ok || !createCampaignBody.campaign?.id) {
		console.error("❌ POST campaign:", createCampaign.status, createCampaignBody);
		process.exit(1);
	}

	const campaignId = createCampaignBody.campaign.id;

	const register = await fetch(`${brandingVerifyBaseUrl}/api/loyalty/customers/register`, {
		method: "POST",
		headers: tenantHeaders({ "Content-Type": "application/json" }),
		body: JSON.stringify({ name: `Customer zone client ${suffix}` }),
	});
	const registerBody = (await register.json()) as {
		customer?: { id: string; qrValue: string; name: string };
	};

	if (!register.ok || !registerBody.customer?.qrValue || !registerBody.customer.id) {
		console.error("❌ register customer:", register.status, registerBody);
		process.exit(1);
	}

	const customerId = registerBody.customer.id;
	const qrValue = registerBody.customer.qrValue;
	const scanCount = 9;

	for (let i = 0; i < scanCount; i += 1) {
		const scan = await fetch(`${brandingVerifyBaseUrl}/api/loyalty/scan`, {
			method: "POST",
			headers: ownerHeaders,
			body: JSON.stringify({ qrValue, stampTypeId }),
		});
		const scanBody = (await scan.json()) as {
			stampsAdded?: { campaignId?: string; current: number }[];
		};
		const stamp = scanBody.stampsAdded?.find((row) => row.campaignId === campaignId);

		if (!scan.ok || stamp?.current !== i + 1) {
			console.error(`❌ scan ${i + 1}:`, scan.status, scanBody);
			process.exit(1);
		}
	}

	console.log(`✅ ${scanCount} staff scans recorded (near reward)`);

	const insights = await fetch(`${brandingVerifyBaseUrl}/api/loyalty/customers/insights`, {
		headers: ownerCookieHeader(ownerCookie),
	});
	const insightsBody = (await insights.json()) as InsightsResponse;

	if (!insights.ok || (insightsBody.vipCount ?? 0) < 1 || (insightsBody.nearRewardCount ?? 0) < 1) {
		console.error("❌ GET insights after scans:", insights.status, insightsBody);
		process.exit(1);
	}

	console.log("✅ GET insights after scans");

	const featured = await fetch(
		`${brandingVerifyBaseUrl}/api/loyalty/customers?segment=featured`,
		{ headers: ownerCookieHeader(ownerCookie) },
	);
	const featuredBody = (await featured.json()) as ListResponse;

	if (
		!featured.ok ||
		featuredBody.segment !== "featured" ||
		!featuredBody.customers?.some((row) => row.id === customerId)
	) {
		console.error("❌ GET featured segment:", featured.status, featuredBody);
		process.exit(1);
	}

	console.log("✅ GET featured segment includes scanned customer");

	const nearReward = await fetch(
		`${brandingVerifyBaseUrl}/api/loyalty/customers?segment=near_reward`,
		{ headers: ownerCookieHeader(ownerCookie) },
	);
	const nearRewardBody = (await nearReward.json()) as ListResponse;
	const nearRewardRow = nearRewardBody.customers?.find((row) => row.id === customerId);

	if (
		!nearReward.ok ||
		!nearRewardRow?.nearReward ||
		nearRewardRow.nearReward.current !== 9 ||
		nearRewardRow.nearReward.required !== 10
	) {
		console.error("❌ GET near_reward segment:", nearReward.status, nearRewardBody);
		process.exit(1);
	}

	console.log("✅ GET near_reward segment");

	const allCustomers = await fetch(`${brandingVerifyBaseUrl}/api/loyalty/customers?segment=all`, {
		headers: ownerCookieHeader(ownerCookie),
	});
	const allBody = (await allCustomers.json()) as ListResponse;

	if (!allCustomers.ok || !allBody.customers?.some((row) => row.id === customerId)) {
		console.error("❌ GET all segment:", allCustomers.status, allBody);
		process.exit(1);
	}

	console.log("✅ GET all segment");

	const detail = await fetch(`${brandingVerifyBaseUrl}/api/loyalty/customers/${customerId}`, {
		headers: ownerCookieHeader(ownerCookie),
	});
	const detailBody = (await detail.json()) as DetailResponse;

	if (
		!detail.ok ||
		detailBody.id !== customerId ||
		!Array.isArray(detailBody.stampProgress) ||
		detailBody.stampProgress.length < 1 ||
		!Array.isArray(detailBody.recentActivity) ||
		detailBody.recentActivity.length < 1
	) {
		console.error("❌ GET customer detail:", detail.status, detailBody);
		process.exit(1);
	}

	console.log("✅ GET customer detail");

	const missingCustomer = await fetch(
		`${brandingVerifyBaseUrl}/api/loyalty/customers/00000000-0000-4000-8000-000000000099`,
		{ headers: ownerCookieHeader(ownerCookie) },
	);
	const missingCustomerBody = (await missingCustomer.json()) as { error?: { type?: string } };

	if (missingCustomer.status !== 404 || missingCustomerBody.error?.type !== "CustomerNotFound") {
		console.error("❌ GET missing customer:", missingCustomer.status, missingCustomerBody);
		process.exit(1);
	}

	console.log("✅ GET missing customer → 404");

	const employeeEmail = `customerzone.employee.${suffix}@example.com`;
	const employeePassword = "temp-pass-verify-60";

	const invite = await fetch(`${brandingVerifyBaseUrl}/api/tenant/employees`, {
		method: "POST",
		headers: ownerHeaders,
		body: JSON.stringify({
			name: "Customer Zone Verify Employee",
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
		console.error("❌ employee login:", employeeLogin.status);
		process.exit(1);
	}

	const employeeInsights = await fetch(`${brandingVerifyBaseUrl}/api/loyalty/customers/insights`, {
		headers: tenantHeaders({ cookie: `session=${employeeCookie}` }),
	});
	const employeeBody = (await employeeInsights.json()) as { error?: { type?: string } };

	if (employeeInsights.status !== 403 || employeeBody.error?.type !== "CustomerZoneForbidden") {
		console.error("❌ employee GET insights:", employeeInsights.status, employeeBody);
		process.exit(1);
	}

	console.log("✅ employee GET insights → 403 CustomerZoneForbidden");
	console.log("✅ verify:customer-zone passed");
}

void main();
