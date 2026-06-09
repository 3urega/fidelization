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

function tenantHeaders(extra: Record<string, string> = {}): Record<string, string> {
	return {
		[TENANT_ID_HEADER]: tenantId,
		[TENANT_SLUG_HEADER]: tenantSlug,
		...extra,
	};
}

/**
 * E2E: active stamp campaign → staff scan → customer_stamp_progress + stamp_added tx.
 */
async function main(): Promise<void> {
	if (!process.env.DATABASE_URL) {
		console.error("❌ DATABASE_URL required");
		process.exit(1);
	}

	await ensureDemoTenantActive();

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

	const campaignName = `Verify stamp scan ${Date.now()}`;
	const createCampaign = await fetch(`${apexBaseUrl}/api/loyalty/stamp-campaigns`, {
		method: "POST",
		headers: ownerHeaders,
		body: JSON.stringify({ name: campaignName, requiredStamps: 10 }),
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

	const scan = await fetch(`${apexBaseUrl}/api/loyalty/scan`, {
		method: "POST",
		headers: ownerHeaders,
		body: JSON.stringify({ qrValue }),
	});
	const scanBody = (await scan.json()) as {
		customer?: { pointsBalance: number; visitsCount: number };
		stampsAdded?: { current: number; required: number; completed: boolean }[];
	};

	if (
		!scan.ok ||
		scanBody.stampsAdded?.length !== 1 ||
		scanBody.stampsAdded[0]?.current !== 1 ||
		scanBody.stampsAdded[0]?.required !== 10
	) {
		console.error("❌ POST /api/loyalty/scan:", scan.status, scanBody);
		process.exit(1);
	}

	console.log("✅ POST /api/loyalty/scan → stampsAdded 1/10");

	const progress = await prisma.customerStampProgress.findFirst({
		where: { tenantId: DEMO_TENANT_ID, customerId, campaignId },
	});

	if (!progress || progress.currentStamps !== 1 || progress.completed) {
		console.error("❌ Prisma customer_stamp_progress after first scan:", progress);
		process.exit(1);
	}

	const stampTxCount = await prisma.loyaltyTransaction.count({
		where: { tenantId: DEMO_TENANT_ID, customerId, type: "stamp_added" },
	});

	if (stampTxCount !== 1) {
		console.error("❌ Prisma stamp_added count after first scan:", stampTxCount);
		process.exit(1);
	}

	console.log("✅ Prisma progress + stamp_added after first scan");

	for (let i = 2; i <= 10; i += 1) {
		const nextScan = await fetch(`${apexBaseUrl}/api/loyalty/scan`, {
			method: "POST",
			headers: ownerHeaders,
			body: JSON.stringify({ qrValue }),
		});
		const nextBody = (await nextScan.json()) as {
			stampsAdded?: { current: number; completed: boolean }[];
		};

		if (!nextScan.ok || nextBody.stampsAdded?.[0]?.current !== i) {
			console.error(`❌ scan ${i}/10:`, nextScan.status, nextBody);
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

	const afterCompleted = await fetch(`${apexBaseUrl}/api/loyalty/scan`, {
		method: "POST",
		headers: ownerHeaders,
		body: JSON.stringify({ qrValue }),
	});
	const afterCompletedBody = (await afterCompleted.json()) as {
		stampsAdded?: unknown[];
	};

	if (!afterCompleted.ok || (afterCompletedBody.stampsAdded?.length ?? 0) !== 0) {
		console.error("❌ scan after completed should not add stamps:", afterCompleted.status, afterCompletedBody);
		process.exit(1);
	}

	const finalStampTxCount = await prisma.loyaltyTransaction.count({
		where: { tenantId: DEMO_TENANT_ID, customerId, type: "stamp_added" },
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

	const inactiveScan = await fetch(`${apexBaseUrl}/api/loyalty/scan`, {
		method: "POST",
		headers: ownerHeaders,
		body: JSON.stringify({ qrValue: inactiveQr }),
	});
	const inactiveScanBody = (await inactiveScan.json()) as { stampsAdded?: unknown[] };

	if (!inactiveScan.ok || (inactiveScanBody.stampsAdded?.length ?? 0) !== 0) {
		console.error("❌ inactive campaign scan:", inactiveScan.status, inactiveScanBody);
		process.exit(1);
	}

	const inactiveProgress = await prisma.customerStampProgress.findFirst({
		where: { tenantId: DEMO_TENANT_ID, customerId: inactiveCustomerId, campaignId },
	});

	if (inactiveProgress) {
		console.error("❌ inactive campaign should not create progress:", inactiveProgress);
		process.exit(1);
	}

	console.log("✅ inactive campaign does not add stamps");

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
