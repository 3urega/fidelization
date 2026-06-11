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
 * E2E: staff session → POST /api/loyalty/scan → customer points + loyalty_transactions row.
 * Legacy path: customers.qr_value (tenant subdomain / headers). User global QR: verify:platform-app-global-qr-scan.
 */
async function main(): Promise<void> {
	if (!process.env.DATABASE_URL) {
		console.error("❌ DATABASE_URL required");
		process.exit(1);
	}

	await ensureDemoTenantActive();

	const register = await fetch(`${apexBaseUrl}/api/loyalty/customers/register`, {
		method: "POST",
		headers: tenantHeaders({ "Content-Type": "application/json" }),
		body: JSON.stringify({ name: "Scan Verify Customer" }),
	});
	const registerBody = (await register.json()) as {
		customer?: { id: string; qrValue: string };
	};
	if (register.status !== 201 || !registerBody.customer?.id || !registerBody.customer.qrValue) {
		console.error("❌ setup register:", register.status, registerBody);
		process.exit(1);
	}

	const customerId = registerBody.customer.id;
	const qrValue = registerBody.customer.qrValue;
	console.log("✅ setup customer for scan");

	const ownerLogin = await fetch(`${apexBaseUrl}/api/auth/demo`, { method: "POST" });
	const ownerCookie = parseSetCookieSession(ownerLogin.headers.get("set-cookie"));
	if (!ownerLogin.ok || !ownerCookie) {
		console.error("❌ owner demo login");
		process.exit(1);
	}

	const before = await prisma.customer.findUnique({ where: { id: customerId } });
	if (!before) {
		console.error("❌ customer row missing");
		process.exit(1);
	}

	const scanOptionsRes = await fetch(`${apexBaseUrl}/api/loyalty/stamp-types`, {
		headers: tenantHeaders({ cookie: `session=${ownerCookie}` }),
	});
	const scanOptionsBody = (await scanOptionsRes.json()) as { selectionRequired?: boolean };
	const scanPayload =
		scanOptionsBody.selectionRequired === true
			? { qrValue, stampTypeId: null }
			: { qrValue };

	const scan = await fetch(`${apexBaseUrl}/api/loyalty/scan`, {
		method: "POST",
		headers: tenantHeaders({
			"Content-Type": "application/json",
			cookie: `session=${ownerCookie}`,
		}),
		body: JSON.stringify(scanPayload),
	});
	const scanBody = (await scan.json()) as {
		customer?: { pointsBalance: number; visitsCount: number; name: string };
		error?: { description?: string };
	};

	if (!scan.ok || scanBody.customer?.pointsBalance !== before.pointsBalance + 1) {
		console.error("❌ POST /api/loyalty/scan:", scan.status, scanBody);
		process.exit(1);
	}

	console.log("✅ POST /api/loyalty/scan → points +1");

	const after = await prisma.customer.findUnique({ where: { id: customerId } });
	const txCount = await prisma.loyaltyTransaction.count({
		where: { customerId, tenantId: DEMO_TENANT_ID, type: "points_earned" },
	});

	if (!after || after.visitsCount !== before.visitsCount + 1 || txCount < 1) {
		console.error("❌ Prisma after scan:", after, "txCount:", txCount);
		process.exit(1);
	}

	console.log("✅ Prisma: visits_count +1 and loyalty_transactions row");

	const customerScan = await fetch(`${apexBaseUrl}/api/loyalty/scan`, {
		method: "POST",
		headers: tenantHeaders({ "Content-Type": "application/json" }),
		body: JSON.stringify({ qrValue }),
	});

	if (customerScan.status !== 401) {
		console.error("❌ customer session on scan expected 401:", customerScan.status);
		process.exit(1);
	}

	console.log("✅ customer session cannot call staff scan → 401");

	await prisma.loyaltyTransaction.deleteMany({ where: { customerId } });
	await prisma.customer.deleteMany({ where: { id: customerId } });

	console.log("✅ verify:customer-scan passed");
}

void main();
