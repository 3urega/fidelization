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
	tenantId,
	tenantSlug,
} from "./lib/customer-verify-helpers";
import {
	campaignScanBody,
	findStampAddedOutcome,
	hasStaffScanOutcome,
	postStaffScan,
} from "./lib/staff-scan-verify-helpers";

function tenantHeaders(extra: Record<string, string> = {}): Record<string, string> {
	return {
		[TENANT_ID_HEADER]: tenantId,
		[TENANT_SLUG_HEADER]: tenantSlug,
		...extra,
	};
}

/**
 * E2E: active stamp campaign → staff scan by targetId → progress + stamp_added tx.
 */
async function main(): Promise<void> {
	if (!process.env.DATABASE_URL) {
		console.error("❌ DATABASE_URL required");
		process.exit(1);
	}

	await ensureDemoTenantActive();

	await prisma.stampCampaign.updateMany({
		where: { tenantId: DEMO_TENANT_ID, name: { startsWith: "Verify stamp scan" } },
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

	const typeLabel = `Verify stamp scan type ${Date.now()}`;
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
	console.log("✅ setup stamp type for scan verify");

	const campaignName = `Verify stamp scan ${Date.now()}`;
	const createCampaign = await fetch(`${apexBaseUrl}/api/loyalty/stamp-campaigns`, {
		method: "POST",
		headers: ownerHeaders,
		body: JSON.stringify({ name: campaignName, requiredStamps: 10, stampTypeId }),
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

	const register = await fetch(`${apexBaseUrl}/api/loyalty/customers/register`, {
		method: "POST",
		headers: tenantHeaders({ "Content-Type": "application/json" }),
		body: JSON.stringify({ name: "Stamp Scan Verify Customer" }),
	});
	const registerBody = (await register.json()) as {
		customer?: { id: string; qrValue: string };
	};

	if (!register.ok || !registerBody.customer?.id || !registerBody.customer.qrValue) {
		console.error("❌ setup register customer:", register.status, registerBody);
		process.exit(1);
	}

	const customerId = registerBody.customer.id;
	const qrValue = registerBody.customer.qrValue;
	console.log("✅ setup customer for stamp scan");

	const scan = await postStaffScan(apexBaseUrl, ownerHeaders, campaignScanBody(qrValue, campaignId));
	const scanStamp = findStampAddedOutcome(scan.body.outcomes, campaignId);

	if (
		scan.status !== 200 ||
		!scanStamp ||
		scanStamp.current !== 1 ||
		scanStamp.required !== 10
	) {
		console.error("❌ POST /api/loyalty/scan:", scan.status, scan.body);
		process.exit(1);
	}

	console.log("✅ POST /api/loyalty/scan → outcomes stamp_added 1/10");

	const progress = await prisma.customerStampProgress.findFirst({
		where: { tenantId: DEMO_TENANT_ID, customerId, campaignId },
	});

	if (!progress || progress.currentStamps !== 1 || progress.completed) {
		console.error("❌ Prisma customer_stamp_progress after first scan:", progress);
		process.exit(1);
	}

	const stampTxCount = await prisma.loyaltyTransaction.count({
		where: {
			tenantId: DEMO_TENANT_ID,
			customerId,
			type: "stamp_added",
			metadata: { path: ["campaignId"], equals: campaignId },
		},
	});

	if (stampTxCount !== 1) {
		console.error("❌ Prisma stamp_added count after first scan:", stampTxCount);
		process.exit(1);
	}

	console.log("✅ Prisma progress + stamp_added after first scan");

	for (let i = 2; i <= 10; i += 1) {
		const nextScan = await postStaffScan(
			apexBaseUrl,
			ownerHeaders,
			campaignScanBody(qrValue, campaignId),
		);
		const campaignStamp = findStampAddedOutcome(nextScan.body.outcomes, campaignId);

		if (nextScan.status !== 200 || campaignStamp?.current !== i) {
			console.error(`❌ scan ${i}/10:`, nextScan.status, nextScan.body);
			process.exit(1);
		}
	}

	const completedProgress = await prisma.customerStampProgress.findFirst({
		where: { tenantId: DEMO_TENANT_ID, customerId, campaignId },
	});

	if (!completedProgress || completedProgress.currentStamps !== 10 || !completedProgress.completed) {
		console.error("❌ Prisma progress after 10 scans:", completedProgress);
		process.exit(1);
	}

	console.log("✅ ten scans complete campaign");

	const afterCompleted = await postStaffScan(
		apexBaseUrl,
		ownerHeaders,
		campaignScanBody(qrValue, campaignId),
	);

	if (
		afterCompleted.status !== 200 ||
		!hasStaffScanOutcome(afterCompleted.body.outcomes, "card_already_completed") ||
		hasStaffScanOutcome(afterCompleted.body.outcomes, "stamp_added")
	) {
		console.error("❌ scan after completed should not add stamps:", afterCompleted.status, afterCompleted.body);
		process.exit(1);
	}

	const finalStampTxCount = await prisma.loyaltyTransaction.count({
		where: {
			tenantId: DEMO_TENANT_ID,
			customerId,
			type: "stamp_added",
			metadata: { path: ["campaignId"], equals: campaignId },
		},
	});

	if (finalStampTxCount !== 10) {
		console.error("❌ expected 10 stamp_added rows, got", finalStampTxCount);
		process.exit(1);
	}

	console.log("✅ completed campaign does not add more stamps");

	const deactivate = await fetch(`${apexBaseUrl}/api/loyalty/stamp-campaigns/${campaignId}`, {
		method: "PATCH",
		headers: ownerHeaders,
		body: JSON.stringify({ isActive: false }),
	});

	if (!deactivate.ok) {
		console.error("❌ deactivate campaign:", deactivate.status);
		process.exit(1);
	}

	const registerInactive = await fetch(`${apexBaseUrl}/api/loyalty/customers/register`, {
		method: "POST",
		headers: tenantHeaders({ "Content-Type": "application/json" }),
		body: JSON.stringify({ name: "Inactive Campaign Customer" }),
	});
	const registerInactiveBody = (await registerInactive.json()) as {
		customer?: { id: string; qrValue: string };
	};

	if (!registerInactive.ok || !registerInactiveBody.customer?.id) {
		console.error("❌ setup customer for inactive campaign:", registerInactive.status, registerInactiveBody);
		process.exit(1);
	}

	const inactiveCustomerId = registerInactiveBody.customer.id;
	const inactiveQr = registerInactiveBody.customer.qrValue;

	const inactiveScan = await postStaffScan(
		apexBaseUrl,
		ownerHeaders,
		campaignScanBody(inactiveQr, campaignId),
	);

	if (inactiveScan.status !== 400 || inactiveScan.body.error?.type !== "InvalidStampScan") {
		console.error("❌ inactive campaign scan expected 400:", inactiveScan.status, inactiveScan.body);
		process.exit(1);
	}

	const inactiveProgress = await prisma.customerStampProgress.findFirst({
		where: { tenantId: DEMO_TENANT_ID, customerId: inactiveCustomerId, campaignId },
	});

	if (inactiveProgress) {
		console.error("❌ inactive campaign should not create progress:", inactiveProgress);
		process.exit(1);
	}

	console.log("✅ inactive campaign target → 400 InvalidStampScan");

	await prisma.loyaltyTransaction.deleteMany({
		where: { customerId: { in: [customerId, inactiveCustomerId] } },
	});
	await prisma.customerStampProgress.deleteMany({
		where: { customerId: { in: [customerId, inactiveCustomerId] } },
	});
	await prisma.customer.deleteMany({
		where: { id: { in: [customerId, inactiveCustomerId] } },
	});
	await prisma.stampCampaign.update({
		where: { id: campaignId },
		data: { isActive: false },
	});

	console.log("✅ verify:customer-stamp-scan passed");
}

void main();
