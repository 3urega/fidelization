/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import {
	TENANT_ID_HEADER,
	TENANT_SLUG_HEADER,
} from "../src/lib/tenant/forwardResolvedTenantHeaders";
import { DEMO_TENANT_ID } from "../src/lib/tenant/mockTenantBySlug";
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
import { campaignScanBody, postStaffScan } from "./lib/staff-scan-verify-helpers";

function tenantHeaders(extra: Record<string, string> = {}): Record<string, string> {
	return {
		[TENANT_ID_HEADER]: tenantId,
		[TENANT_SLUG_HEADER]: tenantSlug,
		...extra,
	};
}

type StampProgressRow = {
	campaignId: string;
	campaignName: string;
	current: number;
	required: number;
	completed: boolean;
};

/**
 * E2E: active campaign → register → GET me 0/N → staff scan → GET me updated → complete → deactivate hidden.
 */
async function main(): Promise<void> {
	if (!process.env.DATABASE_URL) {
		console.error("❌ DATABASE_URL required");
		process.exit(1);
	}

	await ensureDemoTenantActive();

	console.log(`   tenant host: ${resolveTenantHostHeader()} (Host on 127.0.0.1)`);

	await prisma.stampCampaign.updateMany({
		where: { tenantId: DEMO_TENANT_ID, name: { startsWith: "Verify stamp progress" } },
		data: { isActive: false },
	});

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

	const typeLabel = `Verify stamp progress type ${Date.now()}`;
	const createType = await fetch(`${apexBaseUrl}/api/loyalty/stamp-types`, {
		method: "POST",
		headers: ownerHeaders,
		body: JSON.stringify({ label: typeLabel }),
	});
	const createTypeBody = (await createType.json()) as {
		stampType?: { id: string; isActive: boolean };
	};

	if (!createType.ok || !createTypeBody.stampType?.id || !createTypeBody.stampType.isActive) {
		console.error("❌ setup create stamp type:", createType.status, createTypeBody);
		process.exit(1);
	}

	const stampTypeId = createTypeBody.stampType.id;
	console.log("✅ setup stamp type for progress verify");

	const campaignName = `Verify stamp progress ${Date.now()}`;
	const createCampaign = await fetch(`${apexBaseUrl}/api/loyalty/stamp-campaigns`, {
		method: "POST",
		headers: ownerHeaders,
		body: JSON.stringify({ name: campaignName, requiredStamps: 3, stampTypeId }),
	});
	const createCampaignBody = (await createCampaign.json()) as {
		campaign?: { id: string; isActive: boolean };
	};

	if (!createCampaign.ok || !createCampaignBody.campaign?.id || !createCampaignBody.campaign.isActive) {
		console.error("❌ setup create campaign:", createCampaign.status, createCampaignBody);
		process.exit(1);
	}

	const campaignId = createCampaignBody.campaign.id;
	console.log("✅ setup active stamp campaign");

	const register = await tenantFetch("/api/loyalty/customers/register", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ name: "Stamp Progress Verify Customer" }),
	});
	const registerBody = (await register.json()) as {
		customer?: { id: string; qrValue: string };
		kind?: string;
	};
	const registerCookie = parseSetCookieSession(register.headers.get("set-cookie"));

	if (
		register.status !== 201 ||
		!registerCookie ||
		registerBody.kind !== "customer" ||
		!registerBody.customer?.id ||
		!registerBody.customer.qrValue
	) {
		console.error("❌ setup register customer:", register.status, registerBody);
		process.exit(1);
	}

	const customerId = registerBody.customer.id;
	const qrValue = registerBody.customer.qrValue;
	const customerCookie = `session=${registerCookie}`;
	console.log("✅ setup customer on tenant host");

	const meBefore = await tenantFetch("/api/loyalty/me", {
		headers: { cookie: customerCookie },
	});
	const meBeforeBody = (await meBefore.json()) as {
		stampProgress?: StampProgressRow[];
		kind?: string;
	};
	const beforeRow = meBeforeBody.stampProgress?.find((row) => row.campaignId === campaignId);

	if (
		meBefore.status !== 200 ||
		meBeforeBody.kind !== "customer" ||
		!beforeRow ||
		beforeRow.current !== 0 ||
		beforeRow.required !== 3 ||
		beforeRow.completed
	) {
		console.error("❌ GET /api/loyalty/me before scan:", meBefore.status, meBeforeBody);
		process.exit(1);
	}

	console.log("✅ GET /api/loyalty/me → stampProgress 0/3");

	const scan = await postStaffScan(
		apexBaseUrl,
		ownerHeaders,
		campaignScanBody(qrValue, campaignId),
	);

	if (scan.status !== 200) {
		console.error("❌ POST /api/loyalty/scan:", scan.status, scan.body);
		process.exit(1);
	}

	const meAfterScan = await tenantFetch("/api/loyalty/me", {
		headers: { cookie: customerCookie },
	});
	const meAfterScanBody = (await meAfterScan.json()) as { stampProgress?: StampProgressRow[] };
	const afterScanRow = meAfterScanBody.stampProgress?.find((row) => row.campaignId === campaignId);

	if (
		meAfterScan.status !== 200 ||
		!afterScanRow ||
		afterScanRow.current !== 1 ||
		afterScanRow.completed
	) {
		console.error("❌ GET /api/loyalty/me after scan:", meAfterScan.status, meAfterScanBody);
		process.exit(1);
	}

	console.log("✅ GET /api/loyalty/me after scan → 1/3");

	for (let expected = 2; expected <= 3; expected += 1) {
		const nextScan = await postStaffScan(
			apexBaseUrl,
			ownerHeaders,
			campaignScanBody(qrValue, campaignId),
		);

		if (nextScan.status !== 200) {
			console.error(`❌ scan ${expected}/3:`, nextScan.status, nextScan.body);
			process.exit(1);
		}
	}

	const meCompleted = await tenantFetch("/api/loyalty/me", {
		headers: { cookie: customerCookie },
	});
	const meCompletedBody = (await meCompleted.json()) as { stampProgress?: StampProgressRow[] };
	const completedRow = meCompletedBody.stampProgress?.find((row) => row.campaignId === campaignId);

	if (
		meCompleted.status !== 200 ||
		!completedRow ||
		completedRow.current !== 3 ||
		!completedRow.completed
	) {
		console.error("❌ GET /api/loyalty/me after completion:", meCompleted.status, meCompletedBody);
		process.exit(1);
	}

	console.log("✅ GET /api/loyalty/me → completed campaign");

	const deactivate = await fetch(`${apexBaseUrl}/api/loyalty/stamp-campaigns/${campaignId}`, {
		method: "PATCH",
		headers: ownerHeaders,
		body: JSON.stringify({ isActive: false }),
	});

	if (!deactivate.ok) {
		console.error("❌ deactivate campaign:", deactivate.status);
		process.exit(1);
	}

	const meInactive = await tenantFetch("/api/loyalty/me", {
		headers: { cookie: customerCookie },
	});
	const meInactiveBody = (await meInactive.json()) as { stampProgress?: StampProgressRow[] };
	const inactiveRow = meInactiveBody.stampProgress?.find((row) => row.campaignId === campaignId);

	if (meInactive.status !== 200 || inactiveRow) {
		console.error("❌ inactive campaign should not appear in stampProgress:", meInactiveBody);
		process.exit(1);
	}

	console.log("✅ inactive campaign hidden from stampProgress");

	await prisma.loyaltyTransaction.deleteMany({ where: { customerId } });
	await prisma.customerStampProgress.deleteMany({ where: { customerId } });
	await prisma.customer.delete({ where: { id: customerId } });
	await prisma.stampCampaign.update({
		where: { id: campaignId },
		data: { isActive: false },
	});

	console.log("✅ verify:customer-stamp-progress passed");
}

void main();
