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

const DEMO_QR_VALUE = "demo-qr-cafe-demo";

function tenantHeaders(extra: Record<string, string> = {}): Record<string, string> {
	return {
		[TENANT_ID_HEADER]: tenantId,
		[TENANT_SLUG_HEADER]: tenantSlug,
		...extra,
	};
}

/**
 * E2E: owner invites employee → employee login on tenant host → /panel + scan OK.
 */
async function main(): Promise<void> {
	if (!process.env.DATABASE_URL) {
		console.error("❌ DATABASE_URL required");
		process.exit(1);
	}

	await ensureDemoTenantActive();

	console.log(`   tenant host: ${resolveTenantHostHeader()} (Host on 127.0.0.1)`);

	const employeeEmail = `employee.verify.${Date.now()}@example.com`;
	const employeePassword = "temp-pass-verify-27";
	const employeeName = "Verify Employee 27";

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

	const invite = await fetch(`${apexBaseUrl}/api/tenant/employees`, {
		method: "POST",
		headers: ownerHeaders,
		body: JSON.stringify({
			name: employeeName,
			email: employeeEmail,
			password: employeePassword,
		}),
	});
	const inviteBody = (await invite.json()) as {
		employee?: { id: string; userId: string; email: string; role: string };
	};

	if (
		invite.status !== 201 ||
		!inviteBody.employee?.userId ||
		inviteBody.employee.role !== "employee" ||
		inviteBody.employee.email !== employeeEmail
	) {
		console.error("❌ POST /api/tenant/employees:", invite.status, inviteBody);
		process.exit(1);
	}

	const employeeUserId = inviteBody.employee.userId;
	const membershipId = inviteBody.employee.id;
	console.log("✅ owner invites employee");

	const list = await fetch(`${apexBaseUrl}/api/tenant/employees`, {
		headers: ownerHeaders,
	});
	const listBody = (await list.json()) as { employees?: { email: string }[] };

	if (
		list.status !== 200 ||
		!listBody.employees?.some((row) => row.email === employeeEmail)
	) {
		console.error("❌ GET /api/tenant/employees:", list.status, listBody);
		process.exit(1);
	}

	console.log("✅ owner lists employees");

	const employeeLogin = await tenantFetch("/api/auth/login", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ email: employeeEmail, password: employeePassword }),
	});
	const employeeLoginBody = (await employeeLogin.json()) as {
		role?: string;
		kind?: string;
	};
	const employeeCookie = parseSetCookieSession(employeeLogin.headers.get("set-cookie"));

	if (
		employeeLogin.status !== 200 ||
		!employeeCookie ||
		employeeLoginBody.role !== "employee" ||
		employeeLoginBody.kind !== "tenant"
	) {
		console.error("❌ employee tenant login:", employeeLogin.status, employeeLoginBody);
		process.exit(1);
	}

	console.log("✅ employee login on tenant host → role employee");

	const employeeSession = `session=${employeeCookie}`;

	const me = await tenantFetch("/api/me", {
		headers: { cookie: employeeSession },
	});
	const meBody = (await me.json()) as { role?: string };

	if (me.status !== 200 || meBody.role !== "employee") {
		console.error("❌ GET /api/me as employee:", me.status, meBody);
		process.exit(1);
	}

	console.log("✅ employee GET /api/me");

	const home = await tenantFetch("/panel", {
		headers: { cookie: employeeSession },
	});

	if (home.status !== 200) {
		console.error("❌ GET /panel as employee:", home.status);
		process.exit(1);
	}

	console.log("✅ employee GET /panel → 200");

	const forbiddenEmployees = await tenantFetch("/api/tenant/employees", {
		headers: { cookie: employeeSession },
	});
	const forbiddenBody = (await forbiddenEmployees.json()) as { error?: { type?: string } };

	if (
		forbiddenEmployees.status !== 403 ||
		forbiddenBody.error?.type !== "TenantEmployeesForbidden"
	) {
		console.error("❌ employee GET employees should be 403:", forbiddenEmployees.status, forbiddenBody);
		process.exit(1);
	}

	console.log("✅ employee blocked from GET /api/tenant/employees");

	const demoCustomer = await prisma.customer.findFirst({
		where: { tenantId: DEMO_TENANT_ID, qrValue: DEMO_QR_VALUE },
	});

	if (!demoCustomer) {
		console.error("❌ demo customer seed missing — run db seed");
		process.exit(1);
	}

	const beforePoints = demoCustomer.pointsBalance;

	const scan = await fetch(`${apexBaseUrl}/api/loyalty/scan`, {
		method: "POST",
		headers: tenantHeaders({
			"Content-Type": "application/json",
			cookie: employeeSession,
		}),
		body: JSON.stringify({ qrValue: DEMO_QR_VALUE }),
	});
	const scanBody = (await scan.json()) as {
		customer?: { pointsBalance: number };
	};

	if (!scan.ok || scanBody.customer?.pointsBalance !== beforePoints + 1) {
		console.error("❌ employee POST /api/loyalty/scan:", scan.status, scanBody);
		process.exit(1);
	}

	console.log("✅ employee scan → +1 point");

	await prisma.loyaltyTransaction.deleteMany({
		where: {
			tenantId: DEMO_TENANT_ID,
			customerId: demoCustomer.id,
			createdByUserId: employeeUserId,
		},
	});
	await prisma.customer.update({
		where: { id: demoCustomer.id },
		data: { pointsBalance: beforePoints, visitsCount: demoCustomer.visitsCount },
	});
	await prisma.tenantMembership.delete({ where: { id: membershipId } });
	await prisma.user.delete({ where: { id: employeeUserId } });

	console.log("✅ verify:tenant-employees passed");
}

void main();
