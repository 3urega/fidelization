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

const baseUrl = apexBaseUrl;

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

async function registerUser(name: string): Promise<{ email: string; cookie: string; userId: string }> {
	const email = `verify-e2e-${randomUUID()}@example.local`;
	const password = "password123";

	const register = await fetch(`${baseUrl}/api/auth/register/user`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ name, email, password }),
	});
	const body = (await register.json()) as { user?: { id: string; qrValue?: string | null } };
	const cookie = parseSetCookieSession(register.headers.get("set-cookie"));

	if (register.status !== 201 || !cookie || !body.user?.id) {
		console.error("❌ register user failed", register.status, body);
		process.exit(1);
	}

	return { email, cookie, userId: body.user.id };
}

async function createBusiness(ownerCookie: string, businessName: string): Promise<string> {
	const create = await fetch(`${baseUrl}/api/user/businesses`, {
		method: "POST",
		headers: { "Content-Type": "application/json", ...sessionHeaders(ownerCookie) },
		body: JSON.stringify({ businessName, businessType: "cafe" }),
	});
	const body = (await create.json()) as { tenant?: { slug: string } };

	if (create.status !== 201 || !body.tenant?.slug) {
		console.error("❌ create business failed", body);
		process.exit(1);
	}

	return body.tenant.slug;
}

/**
 * E2E issue #45 VS4: platform app full flow — register → join 2 tenants → dashboard → detail → scan.
 */
async function main(): Promise<void> {
	if (!process.env.DATABASE_URL) {
		console.error("❌ DATABASE_URL required");
		process.exit(1);
	}

	await ensureDemoTenantActive();

	const ownerB = await registerUser("E2E Owner B");
	const slugB = await createBusiness(ownerB.cookie, "Verify E2E Cafe B");
	console.log(`✅ business B ready (${slugB})`);

	const client = await registerUser("E2E Client");
	console.log("✅ client registered");

	const joinDemo = await fetch(`${baseUrl}/api/user/establishments/join`, {
		method: "POST",
		headers: { "Content-Type": "application/json", ...sessionHeaders(client.cookie) },
		body: JSON.stringify({ slug: tenantSlug }),
	});
	if (joinDemo.status !== 201) {
		console.error("❌ join cafe-demo failed", joinDemo.status);
		process.exit(1);
	}

	const joinB = await fetch(`${baseUrl}/api/user/establishments/join`, {
		method: "POST",
		headers: { "Content-Type": "application/json", ...sessionHeaders(client.cookie) },
		body: JSON.stringify({ slug: slugB }),
	});
	if (joinB.status !== 201) {
		console.error("❌ join business B failed", joinB.status);
		process.exit(1);
	}

	console.log("✅ client joined cafe-demo + business B");

	const relationships = await fetch(`${baseUrl}/api/user/me/relationships`, {
		headers: sessionHeaders(client.cookie),
	});
	const relBody = (await relationships.json()) as {
		establishments?: { slug: string }[];
	};

	if (!relationships.ok || relBody.establishments?.length !== 2) {
		console.error("❌ relationships expected 2 establishments", relBody);
		process.exit(1);
	}

	console.log("✅ dashboard relationships lists 2 locales");

	const detail = await fetch(`${baseUrl}/api/user/establishments/${slugB}`, {
		headers: sessionHeaders(client.cookie),
	});
	const detailBody = (await detail.json()) as {
		mode?: string;
		customer?: { id: string; pointsBalance: number };
		userQrValue?: string | null;
	};

	if (
		!detail.ok ||
		detailBody.mode !== "interaction" ||
		!detailBody.customer ||
		!detailBody.userQrValue
	) {
		console.error("❌ establishment detail interaction incomplete", detailBody);
		process.exit(1);
	}

	console.log("✅ establishment detail interaction mode");

	const me = await fetch(`${baseUrl}/api/user/me`, { headers: sessionHeaders(client.cookie) });
	const meBody = (await me.json()) as { user?: { qrValue: string | null } };

	if (!me.ok || !meBody.user?.qrValue) {
		console.error("❌ user global QR missing", meBody);
		process.exit(1);
	}

	const ownerLogin = await fetch(`${baseUrl}/api/auth/demo`, { method: "POST" });
	const ownerCookie = parseSetCookieSession(ownerLogin.headers.get("set-cookie"));
	if (!ownerLogin.ok || !ownerCookie) {
		console.error("❌ demo owner login for scan");
		process.exit(1);
	}

	const demoCustomer = await prisma.customer.findFirst({
		where: { userId: client.userId, tenantId: DEMO_TENANT_ID },
	});
	if (!demoCustomer) {
		console.error("❌ demo customer row missing");
		process.exit(1);
	}

	const ownerHeaders = tenantHeaders({
		"Content-Type": "application/json",
		cookie: `session=${ownerCookie}`,
	});

	const campaignId = await resolveStampCampaignTargetId(
		baseUrl,
		ownerHeaders,
		"Platform E2E verify",
	);

	const scan = await postStaffScan(
		baseUrl,
		ownerHeaders,
		campaignScanBody(meBody.user.qrValue, campaignId),
	);

	if (
		scan.status !== 200 ||
		scan.body.customer?.id !== demoCustomer.id ||
		scan.body.customer.pointsBalance !== demoCustomer.pointsBalance + 1 ||
		!hasStaffScanOutcome(scan.body.outcomes, "point_recorded")
	) {
		console.error("❌ staff scan with user QR failed", scan.status, scan.body);
		process.exit(1);
	}

	console.log("✅ staff scan at cafe-demo → +1 point via users.qr_value");

	const joinPage = await fetch(`${baseUrl}/join/${slugB}`, {
		headers: sessionHeaders(client.cookie),
	});
	const joinHtml = await joinPage.text();
	if (joinPage.status !== 200 || !joinHtml.includes("Uniéndote")) {
		console.error("❌ GET /join/[slug] deep link page");
		process.exit(1);
	}

	console.log("✅ /join/[slug] route OK");

	await prisma.loyaltyTransaction.deleteMany({
		where: {
			customerId: {
				in: (
					await prisma.customer.findMany({
						where: { userId: client.userId },
						select: { id: true },
					})
				).map((row) => row.id),
			},
		},
	});
	await prisma.customerStampProgress.deleteMany({
		where: {
			customerId: {
				in: (
					await prisma.customer.findMany({
						where: { userId: client.userId },
						select: { id: true },
					})
				).map((row) => row.id),
			},
		},
	});
	await prisma.customer.deleteMany({ where: { userId: client.userId } });
	await prisma.tenantMembership.deleteMany({ where: { userId: ownerB.userId } });
	await prisma.user.deleteMany({
		where: { email: { in: [client.email, ownerB.email] } },
	});
	const tenantB = await prisma.tenant.findUnique({ where: { slug: slugB } });
	if (tenantB) {
		await prisma.tenant.delete({ where: { id: tenantB.id } });
	}

	console.log("✅ verify:platform-app-e2e passed");
}

void main();
