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
import {
	campaignScanBody,
	hasStaffScanOutcome,
	postStaffScan,
	resolveStampCampaignTargetId,
} from "./lib/staff-scan-verify-helpers";

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
 * Legacy customers.qr_value path covered by verify:customer-scan.
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

	const ownerHeaders = tenantHeaders({
		"Content-Type": "application/json",
		cookie: `session=${ownerCookie}`,
	});

	const campaignId = await resolveStampCampaignTargetId(
		apexBaseUrl,
		ownerHeaders,
		"Global QR scan verify",
	);

	const scan = await postStaffScan(
		apexBaseUrl,
		ownerHeaders,
		campaignScanBody(userGlobalQr, campaignId),
	);

	if (
		scan.status !== 200 ||
		scan.body.customer?.id !== customerId ||
		scan.body.customer?.pointsBalance !== before.pointsBalance + 1 ||
		!hasStaffScanOutcome(scan.body.outcomes, "point_recorded")
	) {
		console.error("❌ POST /api/loyalty/scan with user QR:", scan.status, scan.body);
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
	const orphanBody = (await orphanRegister.json()) as {
		user?: { id: string; qrValue: string | null };
	};

	if (orphanRegister.status !== 201 || !orphanBody.user?.id || !orphanBody.user.qrValue) {
		console.error("❌ orphan user register", orphanRegister.status, orphanBody);
		process.exit(1);
	}

	const orphanScan = await postStaffScan(
		apexBaseUrl,
		ownerHeaders,
		campaignScanBody(orphanBody.user.qrValue, campaignId),
	);

	if (
		orphanScan.status !== 200 ||
		orphanScan.body.customer?.pointsBalance !== 1 ||
		orphanScan.body.customer.visitsCount !== 1 ||
		!hasStaffScanOutcome(orphanScan.body.outcomes, "point_recorded")
	) {
		console.error("❌ orphan user first scan expected auto-join + point:", orphanScan.status, orphanScan.body);
		process.exit(1);
	}

	const orphanCustomer = await prisma.customer.findFirst({
		where: { userId: orphanBody.user.id, tenantId: DEMO_TENANT_ID },
	});
	if (!orphanCustomer || orphanCustomer.id !== orphanScan.body.customer?.id) {
		console.error("❌ auto-join customer row missing in Prisma");
		process.exit(1);
	}

	console.log("✅ first scan without join → auto-join + 1 point in tenant");

	await prisma.loyaltyTransaction.deleteMany({ where: { customerId } });
	await prisma.customer.deleteMany({ where: { id: customerId } });
	await prisma.loyaltyTransaction.deleteMany({
		where: { customerId: orphanCustomer.id },
	});
	await prisma.customerStampProgress.deleteMany({
		where: { customerId: { in: [customerId, orphanCustomer.id] } },
	});
	await prisma.customer.deleteMany({ where: { id: orphanCustomer.id } });
	await prisma.user.deleteMany({
		where: { email: { in: [clientEmail, orphanEmail] } },
	});

	console.log("✅ verify:platform-app-global-qr-scan passed");
}

void main();
