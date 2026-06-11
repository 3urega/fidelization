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
 * E2E: typed stamp types + campaigns → staff scan with stampTypeId routes stamps correctly.
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

	const suffix = Date.now();
	const cafeLabel = `Verify Café ${suffix}`;
	const menuLabel = `Verify Menú ${suffix}`;

	const createCafeType = await fetch(`${apexBaseUrl}/api/loyalty/stamp-types`, {
		method: "POST",
		headers: ownerHeaders,
		body: JSON.stringify({ label: cafeLabel }),
	});
	const cafeTypeBody = (await createCafeType.json()) as { stampType?: { id: string } };

	if (!createCafeType.ok || !cafeTypeBody.stampType?.id) {
		console.error("❌ setup café type:", createCafeType.status, cafeTypeBody);
		process.exit(1);
	}

	const cafeTypeId = cafeTypeBody.stampType.id;

	const createMenuType = await fetch(`${apexBaseUrl}/api/loyalty/stamp-types`, {
		method: "POST",
		headers: ownerHeaders,
		body: JSON.stringify({ label: menuLabel }),
	});
	const menuTypeBody = (await createMenuType.json()) as { stampType?: { id: string } };

	if (!createMenuType.ok || !menuTypeBody.stampType?.id) {
		console.error("❌ setup menú type:", createMenuType.status, menuTypeBody);
		process.exit(1);
	}

	const menuTypeId = menuTypeBody.stampType.id;
	console.log("✅ setup stamp types");

	const createCoffeeCampaign = await fetch(`${apexBaseUrl}/api/loyalty/stamp-campaigns`, {
		method: "POST",
		headers: ownerHeaders,
		body: JSON.stringify({
			name: `10 cafés gratis ${suffix}`,
			requiredStamps: 10,
			stampTypeId: cafeTypeId,
		}),
	});
	const coffeeCampaignBody = (await createCoffeeCampaign.json()) as {
		campaign?: { id: string };
	};

	if (!createCoffeeCampaign.ok || !coffeeCampaignBody.campaign?.id) {
		console.error("❌ setup coffee campaign:", createCoffeeCampaign.status, coffeeCampaignBody);
		process.exit(1);
	}

	const coffeeCampaignId = coffeeCampaignBody.campaign.id;

	const createMenuCampaign = await fetch(`${apexBaseUrl}/api/loyalty/stamp-campaigns`, {
		method: "POST",
		headers: ownerHeaders,
		body: JSON.stringify({
			name: `5 menús gratis ${suffix}`,
			requiredStamps: 5,
			stampTypeId: menuTypeId,
		}),
	});
	const menuCampaignBody = (await createMenuCampaign.json()) as {
		campaign?: { id: string };
	};

	if (!createMenuCampaign.ok || !menuCampaignBody.campaign?.id) {
		console.error("❌ setup menu campaign:", createMenuCampaign.status, menuCampaignBody);
		process.exit(1);
	}

	const menuCampaignId = menuCampaignBody.campaign.id;
	console.log("✅ setup typed campaigns");

	const register = await fetch(`${apexBaseUrl}/api/loyalty/customers/register`, {
		method: "POST",
		headers: tenantHeaders({ "Content-Type": "application/json" }),
		body: JSON.stringify({ name: `Targeted Scan Customer ${suffix}` }),
	});
	const registerBody = (await register.json()) as {
		customer?: { id: string; qrValue: string };
	};

	if (!register.ok || !registerBody.customer?.id || !registerBody.customer.qrValue) {
		console.error("❌ setup customer:", register.status, registerBody);
		process.exit(1);
	}

	const customerId = registerBody.customer.id;
	const qrValue = registerBody.customer.qrValue;

	for (let i = 1; i <= 3; i += 1) {
		const scan = await fetch(`${apexBaseUrl}/api/loyalty/scan`, {
			method: "POST",
			headers: ownerHeaders,
			body: JSON.stringify({ qrValue, stampTypeId: cafeTypeId }),
		});
		const scanBody = (await scan.json()) as {
			stampsAdded?: { campaignId?: string; current: number }[];
		};

		const coffeeStamp = scanBody.stampsAdded?.find(
			(stamp) => stamp.campaignId === coffeeCampaignId,
		);

		if (!scan.ok || coffeeStamp?.current !== i) {
			console.error(`❌ café scan ${i}:`, scan.status, scanBody);
			process.exit(1);
		}
	}

	const menuProgressAfterCoffee = await prisma.customerStampProgress.findFirst({
		where: { tenantId: DEMO_TENANT_ID, customerId, campaignId: menuCampaignId },
	});

	if (menuProgressAfterCoffee) {
		console.error("❌ menú progress should not exist after café scans", menuProgressAfterCoffee);
		process.exit(1);
	}

	console.log("✅ café scans only advance coffee campaign");

	for (let i = 1; i <= 2; i += 1) {
		const scan = await fetch(`${apexBaseUrl}/api/loyalty/scan`, {
			method: "POST",
			headers: ownerHeaders,
			body: JSON.stringify({ qrValue, stampTypeId: menuTypeId }),
		});
		const scanBody = (await scan.json()) as {
			stampsAdded?: { campaignId?: string; current: number }[];
		};

		const menuStamp = scanBody.stampsAdded?.find((stamp) => stamp.campaignId === menuCampaignId);

		if (!scan.ok || menuStamp?.current !== i) {
			console.error(`❌ menú scan ${i}:`, scan.status, scanBody);
			process.exit(1);
		}
	}

	console.log("✅ menú scans only advance menu campaign");

	const missingTypeScan = await fetch(`${apexBaseUrl}/api/loyalty/scan`, {
		method: "POST",
		headers: ownerHeaders,
		body: JSON.stringify({ qrValue }),
	});

	if (missingTypeScan.status !== 400) {
		console.error("❌ expected 400 when stampTypeId omitted", missingTypeScan.status);
		process.exit(1);
	}

	console.log("✅ missing stampTypeId → 400");

	await prisma.loyaltyTransaction.deleteMany({ where: { customerId } });
	await prisma.customerStampProgress.deleteMany({ where: { customerId } });
	await prisma.customer.delete({ where: { id: customerId } });
	await prisma.stampCampaign.updateMany({
		where: { id: { in: [coffeeCampaignId, menuCampaignId] } },
		data: { isActive: false },
	});
	await prisma.stampType.updateMany({
		where: { id: { in: [cafeTypeId, menuTypeId] } },
		data: { isActive: false },
	});

	console.log("✅ verify:customer-stamp-scan-targeted passed");
}

void main();
