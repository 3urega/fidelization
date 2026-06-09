/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { randomUUID } from "crypto";

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

function sessionHeaders(session: string): { cookie: string } {
	return { cookie: `session=${session}` };
}

/**
 * E2E issue #44: platform user global QR → staff scan → points in joined tenant.
 * Legacy path covered by verify:customer-scan.
 */
async function main(): Promise<void> {
	if (!process.env.DATABASE_URL) {
		console.error("❌ DATABASE_URL required");
		process.exit(1);
	}

	await ensureDemoTenantActive();

	const clientEmail = `verify-global-qr-${randomUUID()}@example.local`;
	const orphanEmail = `verify-global-qr-orphan-${randomUUID()}@example.local`;
	const password = "password123";

	const clientRegister = await fetch(`${apexBaseUrl}/api/auth/register/user`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ name: "Global QR Client", email: clientEmail, password }),
	});
	const clientRegisterBody = (await clientRegister.json()) as {
		user?: { id: string; qrValue: string | null };
	};
	const clientCookie = parseSetCookieSession(clientRegister.headers.get("set-cookie"));

	if (
		clientRegister.status !== 201 ||
		!clientCookie ||
		!clientRegisterBody.user?.id ||
		!clientRegisterBody.user.qrValue
	) {
		console.error("❌ client register:", clientRegister.status, clientRegisterBody);
		process.exit(1);
	}

	const clientUserId = clientRegisterBody.user.id;
	const userGlobalQr = clientRegisterBody.user.qrValue;
	console.log("✅ platform user registered with global QR");

	const join = await fetch(`${apexBaseUrl}/api/user/establishments/join`, {
		method: "POST",
		headers: { "Content-Type": "application/json", ...sessionHeaders(clientCookie) },
		body: JSON.stringify({ slug: tenantSlug }),
	});
	const joinBody = (await join.json()) as { customer?: { id: string } };

	if (join.status !== 201 || !joinBody.customer?.id) {
		console.error("❌ join cafe-demo failed", join.status, joinBody);
		process.exit(1);
	}

	const customerId = joinBody.customer.id;
	console.log("✅ client joined cafe-demo");

	const before = await prisma.customer.findUnique({ where: { id: customerId } });
	if (!before || before.userId !== clientUserId) {
		console.error("❌ customer row not linked to user", before);
		process.exit(1);
	}

	if (before.qrValue === userGlobalQr) {
		console.error("❌ expected distinct customer vs user QR for global lookup test");
		process.exit(1);
	}

	const ownerLogin = await fetch(`${apexBaseUrl}/api/auth/demo`, { method: "POST" });
	const ownerCookie = parseSetCookieSession(ownerLogin.headers.get("set-cookie"));
	if (!ownerLogin.ok || !ownerCookie) {
		console.error("❌ owner demo login");
		process.exit(1);
	}

	const scan = await fetch(`${apexBaseUrl}/api/loyalty/scan`, {
		method: "POST",
		headers: tenantHeaders({
			"Content-Type": "application/json",
			cookie: `session=${ownerCookie}`,
		}),
		body: JSON.stringify({ qrValue: userGlobalQr }),
	});
	const scanBody = (await scan.json()) as {
		customer?: { id: string; pointsBalance: number; visitsCount: number };
		error?: { type?: string; description?: string };
	};

	if (
		!scan.ok ||
		scanBody.customer?.id !== customerId ||
		scanBody.customer.pointsBalance !== before.pointsBalance + 1
	) {
		console.error("❌ POST /api/loyalty/scan with user QR:", scan.status, scanBody);
		process.exit(1);
	}

	console.log("✅ staff scan with users.qr_value → +1 point in tenant");

	const after = await prisma.customer.findUnique({ where: { id: customerId } });
	const txCount = await prisma.loyaltyTransaction.count({
		where: { customerId, tenantId: DEMO_TENANT_ID, type: "points_earned" },
	});

	if (!after || after.visitsCount !== before.visitsCount + 1 || txCount < 1) {
		console.error("❌ Prisma after global QR scan:", after, "txCount:", txCount);
		process.exit(1);
	}

	console.log("✅ Prisma: visits_count +1 and loyalty_transactions row");

	const orphanRegister = await fetch(`${apexBaseUrl}/api/auth/register/user`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ name: "Orphan QR User", email: orphanEmail, password }),
	});
	const orphanBody = (await orphanRegister.json()) as { user?: { qrValue: string | null } };

	if (orphanRegister.status !== 201 || !orphanBody.user?.qrValue) {
		console.error("❌ orphan user register", orphanRegister.status, orphanBody);
		process.exit(1);
	}

	const orphanScan = await fetch(`${apexBaseUrl}/api/loyalty/scan`, {
		method: "POST",
		headers: tenantHeaders({
			"Content-Type": "application/json",
			cookie: `session=${ownerCookie}`,
		}),
		body: JSON.stringify({ qrValue: orphanBody.user.qrValue }),
	});
	const orphanScanBody = (await orphanScan.json()) as {
		error?: { type?: string; description?: string };
	};

	if (
		orphanScan.status !== 404 ||
		orphanScanBody.error?.type !== "CustomerNotRegisteredInTenant"
	) {
		console.error("❌ orphan user scan expected 404 CustomerNotRegisteredInTenant:", orphanScan.status, orphanScanBody);
		process.exit(1);
	}

	console.log("✅ scan without join → CustomerNotRegisteredInTenant 404");

	await prisma.loyaltyTransaction.deleteMany({ where: { customerId } });
	await prisma.customer.deleteMany({ where: { id: customerId } });
	await prisma.user.deleteMany({
		where: { email: { in: [clientEmail, orphanEmail] } },
	});

	console.log("✅ verify:platform-app-global-qr-scan passed");
}

void main();
