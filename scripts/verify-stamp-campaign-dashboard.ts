/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { prisma } from "../src/lib/prisma";
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
import {
	campaignScanBody,
	findStampAddedOutcome,
	postStaffScan,
} from "./lib/staff-scan-verify-helpers";

type DashboardResponse = {
	campaigns?: {
		id: string;
		name: string;
		stampTypeLabel: string;
		requiredStamps: number;
		scans: {
			today: number;
			yesterday: number;
			last7Days: number;
			sinceStart: number;
		};
	}[];
	generatedAt?: string;
	timezone?: string;
};

function tenantHeaders(extra: Record<string, string> = {}): Record<string, string> {
	return {
		[TENANT_ID_HEADER]: tenantId,
		[TENANT_SLUG_HEADER]: tenantSlug,
		...extra,
	};
}

/**
 * E2E: owner stamp campaign dashboard GET + scan counts via POST /api/loyalty/scan.
 * Requires dev server at NEXT_PUBLIC_API_URL and DATABASE_URL.
 */
async function main(): Promise<void> {
	if (!process.env.DATABASE_URL) {
		console.error("❌ DATABASE_URL required");
		process.exit(1);
	}

	await ensureDemoTenantActive();

	const unauthenticated = await fetch(`${brandingVerifyBaseUrl}/api/loyalty/stamp-campaigns/dashboard`);
	if (unauthenticated.status !== 401) {
		console.error("❌ GET dashboard without session:", unauthenticated.status);
		process.exit(1);
	}

	console.log("✅ GET dashboard without session → 401");

	const ownerCookie = await loginOwnerForBrandingVerify();
	const ownerHeaders = tenantHeaders({
		cookie: `session=${ownerCookie}`,
		"Content-Type": "application/json",
	});

	const baseline = await fetch(`${brandingVerifyBaseUrl}/api/loyalty/stamp-campaigns/dashboard`, {
		headers: { cookie: ownerHeaders.cookie ?? "" },
	});
	const baselineBody = (await baseline.json()) as DashboardResponse;

	if (!baseline.ok || !Array.isArray(baselineBody.campaigns)) {
		console.error("❌ GET dashboard baseline:", baseline.status, baselineBody);
		process.exit(1);
	}

	console.log(`✅ GET dashboard baseline (${baselineBody.campaigns.length} active campaigns)`);

	const suffix = Date.now();
	const typeLabel = `Dashboard verify ${suffix}`;

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
	const campaignName = `Dashboard campaign ${suffix}`;

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
		campaign?: { id: string; name: string; isActive: boolean };
	};

	if (
		!createCampaign.ok ||
		!createCampaignBody.campaign?.id ||
		!createCampaignBody.campaign.isActive
	) {
		console.error("❌ POST campaign:", createCampaign.status, createCampaignBody);
		process.exit(1);
	}

	const campaignId = createCampaignBody.campaign.id;
	console.log(`✅ setup campaign ${campaignId}`);

	const register = await fetch(`${brandingVerifyBaseUrl}/api/loyalty/customers/register`, {
		method: "POST",
		headers: tenantHeaders({ "Content-Type": "application/json" }),
		body: JSON.stringify({ name: `Dashboard customer ${suffix}` }),
	});
	const registerBody = (await register.json()) as {
		customer?: { id: string; qrValue: string };
	};

	if (!register.ok || !registerBody.customer?.qrValue) {
		console.error("❌ register customer:", register.status, registerBody);
		process.exit(1);
	}

	const qrValue = registerBody.customer.qrValue;
	const scanCount = 3;

	for (let i = 0; i < scanCount; i += 1) {
		const scan = await postStaffScan(
			brandingVerifyBaseUrl,
			ownerHeaders,
			campaignScanBody(qrValue, campaignId),
		);
		const stamp = findStampAddedOutcome(scan.body.outcomes, campaignId);

		if (scan.status !== 200 || stamp?.current !== i + 1) {
			console.error(`❌ scan ${i + 1}:`, scan.status, scan.body);
			process.exit(1);
		}
	}

	console.log(`✅ ${scanCount} staff scans recorded`);

	const dashboard = await fetch(`${brandingVerifyBaseUrl}/api/loyalty/stamp-campaigns/dashboard`, {
		headers: { cookie: ownerHeaders.cookie ?? "" },
	});
	const dashboardBody = (await dashboard.json()) as DashboardResponse;

	if (!dashboard.ok || !dashboardBody.campaigns) {
		console.error("❌ GET dashboard after scans:", dashboard.status, dashboardBody);
		process.exit(1);
	}

	const row = dashboardBody.campaigns.find((campaign) => campaign.id === campaignId);

	if (!row) {
		console.error("❌ campaign missing from dashboard", dashboardBody.campaigns);
		process.exit(1);
	}

	if (
		row.name !== campaignName ||
		row.stampTypeLabel !== typeLabel ||
		row.scans.today !== scanCount ||
		row.scans.sinceStart !== scanCount
	) {
		console.error("❌ unexpected dashboard row", row);
		process.exit(1);
	}

	const txCount = await prisma.loyaltyTransaction.count({
		where: {
			tenantId,
			type: "stamp_added",
		},
	});

	if (txCount < scanCount) {
		console.error("❌ expected stamp_added rows in Prisma", { txCount, scanCount });
		process.exit(1);
	}

	console.log("✅ GET dashboard scan counts match staff scans");

	const employeeEmail = `dashboard.employee.${suffix}@example.com`;
	const employeePassword = "temp-pass-verify-56";

	const invite = await fetch(`${brandingVerifyBaseUrl}/api/tenant/employees`, {
		method: "POST",
		headers: ownerHeaders,
		body: JSON.stringify({
			name: "Dashboard Verify Employee",
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

	const employeeDashboard = await fetch(`${brandingVerifyBaseUrl}/api/loyalty/stamp-campaigns/dashboard`, {
		headers: tenantHeaders({ cookie: `session=${employeeCookie}` }),
	});
	const employeeBody = (await employeeDashboard.json()) as { error?: { type?: string } };

	if (employeeDashboard.status !== 403 || employeeBody.error?.type !== "StampCampaignForbidden") {
		console.error("❌ employee GET dashboard:", employeeDashboard.status, employeeBody);
		process.exit(1);
	}

	console.log("✅ employee GET dashboard → 403 StampCampaignForbidden");
	console.log("✅ verify:stamp-campaign-dashboard passed");
}

void main();
