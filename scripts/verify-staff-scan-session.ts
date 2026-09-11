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
import { campaignScanBody, postStaffScan } from "./lib/staff-scan-verify-helpers";

const PLAN_BASIC_ID = "00000000-0000-4000-8000-000000000004";
const PLAN_PRO_ID = "00000000-0000-4000-8000-000000000006";

function tenantHeaders(extra: Record<string, string> = {}): Record<string, string> {
	return {
		[TENANT_ID_HEADER]: tenantId,
		[TENANT_SLUG_HEADER]: tenantSlug,
		...extra,
	};
}

type SessionResponse = {
	customer?: { id: string; name: string; pointsBalance: number; visitsCount: number };
	stampCards?: { campaignId: string; current: number; required: number; canAddStamp: boolean }[];
	tenantCapabilities?: {
		promotionsEnabled?: boolean;
		roulette?: { authorizeEnabled?: boolean; unlockEnabled?: boolean } | null;
	};
	roulette?: { pendingPhysicalCount?: number; participation?: { spinsRemainingToday?: number } } | null;
	error?: { type?: string; description?: string };
};

async function getSession(
	headers: Record<string, string>,
	query: Record<string, string>,
): Promise<{ status: number; body: SessionResponse }> {
	const params = new URLSearchParams(query);
	const response = await fetch(
		`${brandingVerifyBaseUrl}/api/loyalty/scan/session?${params.toString()}`,
		{ headers },
	);

	return { status: response.status, body: (await response.json()) as SessionResponse };
}

/**
 * E2E: GET /api/loyalty/scan/session (owner + employee, qrValue + customerId).
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
		tenant?: { subscriptionPlanId: string | null };
		role?: string;
	};

	if (!me.ok || meBody.role !== "owner") {
		console.error("❌ GET /api/me (owner):", me.status, meBody);
		process.exit(1);
	}

	const restorePlanId = meBody.tenant?.subscriptionPlanId ?? PLAN_BASIC_ID;

	await fetch(`${brandingVerifyBaseUrl}/api/billing/tenant-plan`, {
		method: "PATCH",
		headers: ownerHeaders,
		body: JSON.stringify({ planId: PLAN_PRO_ID }),
	});

	const suffix = Date.now();
	const createCampaign = await fetch(`${brandingVerifyBaseUrl}/api/loyalty/stamp-campaigns`, {
		method: "POST",
		headers: ownerHeaders,
		body: JSON.stringify({
			name: `Session verify ${suffix}`,
			requiredStamps: 10,
			visualTemplate: "coffee",
		}),
	});
	const createCampaignBody = (await createCampaign.json()) as { campaign?: { id: string } };

	if (!createCampaign.ok || !createCampaignBody.campaign?.id) {
		console.error("❌ POST stamp-campaign:", createCampaign.status, createCampaignBody);
		process.exit(1);
	}

	const campaignId = createCampaignBody.campaign.id;

	const customerRegister = await fetch(`${apexBaseUrl}/api/loyalty/customers/register`, {
		method: "POST",
		headers: tenantHeaders({ "Content-Type": "application/json" }),
		body: JSON.stringify({ name: `Session Customer ${suffix}` }),
	});
	const customerRegisterBody = (await customerRegister.json()) as {
		customer?: { id: string; qrValue: string };
	};

	if (
		customerRegister.status !== 201 ||
		!customerRegisterBody.customer?.id ||
		!customerRegisterBody.customer.qrValue
	) {
		console.error("❌ customer register:", customerRegister.status, customerRegisterBody);
		process.exit(1);
	}

	const customerId = customerRegisterBody.customer.id;
	const qrValue = customerRegisterBody.customer.qrValue;

	for (let scan = 0; scan < 3; scan += 1) {
		const result = await postStaffScan(
			brandingVerifyBaseUrl,
			ownerHeaders,
			campaignScanBody(qrValue, campaignId),
		);

		if (result.status !== 200) {
			console.error(`❌ POST scan #${scan + 1}:`, result.status, result.body);
			process.exit(1);
		}
	}

	const byCustomerId = await getSession(ownerHeaders, { customerId });
	const card = byCustomerId.body.stampCards?.find((row) => row.campaignId === campaignId);

	if (
		byCustomerId.status !== 200 ||
		!card ||
		card.current !== 3 ||
		card.required !== 10 ||
		!card.canAddStamp
	) {
		console.error("❌ GET session?customerId= progress 3/10", byCustomerId.status, byCustomerId.body);
		process.exit(1);
	}

	console.log("✅ GET /api/loyalty/scan/session?customerId= (3/10)");

	const byQr = await getSession(ownerHeaders, { qrValue });

	if (byQr.status !== 200 || byQr.body.customer?.id !== customerId) {
		console.error("❌ GET session?qrValue=", byQr.status, byQr.body);
		process.exit(1);
	}

	console.log("✅ GET /api/loyalty/scan/session?qrValue=");

	const bothParams = await getSession(ownerHeaders, { qrValue, customerId });
	if (bothParams.status !== 400 || bothParams.body.error?.type !== "InvalidStampScan") {
		console.error("❌ both qrValue and customerId should 400:", bothParams.status, bothParams.body);
		process.exit(1);
	}

	console.log("✅ invalid query → 400 InvalidStampScan");

	const employeeEmail = `session.employee.${suffix}@example.com`;
	const employeePassword = "temp-pass-session";
	const invite = await fetch(`${apexBaseUrl}/api/tenant/employees`, {
		method: "POST",
		headers: ownerHeaders,
		body: JSON.stringify({
			name: "Session Employee",
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

	const employeeSession = await getSession(tenantHeaders({ cookie: `session=${employeeCookie}` }), {
		customerId,
	});

	if (employeeSession.status !== 200 || !employeeSession.body.stampCards?.length) {
		console.error("❌ employee GET session:", employeeSession.status, employeeSession.body);
		process.exit(1);
	}

	console.log("✅ GET session (employee)");

	const customerCookie = parseSetCookieSession(customerRegister.headers.get("set-cookie"));
	const customerSession = await getSession(tenantHeaders({ cookie: `session=${customerCookie}` }), {
		customerId,
	});

	if (customerSession.status !== 401) {
		console.error("❌ customer session should 401:", customerSession.status);
		process.exit(1);
	}

	console.log("✅ customer session → 401");

	await fetch(`${brandingVerifyBaseUrl}/api/billing/tenant-plan`, {
		method: "PATCH",
		headers: ownerHeaders,
		body: JSON.stringify({ planId: restorePlanId }),
	});

	console.log("✅ verify:staff-scan-session passed");
}

void main();
