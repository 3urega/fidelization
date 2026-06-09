/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { randomUUID } from "crypto";

import { prisma } from "../src/lib/prisma";

/**
 * E2E: platform user joins establishment by slug (issue #42).
 * Requires dev server + DATABASE_URL.
 */
const baseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000").replace(/\/$/, "");

function parseSessionCookie(setCookie: string | null): string | null {
	if (!setCookie) {
		return null;
	}

	const match = /session=([^;]+)/.exec(setCookie);

	return match?.[1] ?? null;
}

function sessionHeaders(session: string): { cookie: string } {
	return { cookie: `session=${session}` };
}

async function main(): Promise<void> {
	if (!process.env.DATABASE_URL) {
		console.error("❌ DATABASE_URL required");
		process.exit(1);
	}

	const ownerEmail = `verify-join-owner-${randomUUID()}@example.local`;
	const clientEmail = `verify-join-client-${randomUUID()}@example.local`;
	const password = "password123";
	const businessName = "Verify Join Target Cafe";

	const ownerRegister = await fetch(`${baseUrl}/api/auth/register/user`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ name: "Join Owner", email: ownerEmail, password }),
	});
	const ownerCookie = parseSessionCookie(ownerRegister.headers.get("set-cookie"));
	if (ownerRegister.status !== 201 || !ownerCookie) {
		console.error("❌ owner register failed");
		process.exit(1);
	}

	const create = await fetch(`${baseUrl}/api/user/businesses`, {
		method: "POST",
		headers: { "Content-Type": "application/json", ...sessionHeaders(ownerCookie) },
		body: JSON.stringify({ businessName, businessType: "cafe" }),
	});
	const createBody = (await create.json()) as { tenant?: { slug: string } };
	if (create.status !== 201 || !createBody.tenant?.slug) {
		console.error("❌ create target business failed", createBody);
		process.exit(1);
	}

	const targetSlug = createBody.tenant.slug;
	console.log(`✅ target business ready (${targetSlug})`);

	const clientRegister = await fetch(`${baseUrl}/api/auth/register/user`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ name: "Join Client", email: clientEmail, password }),
	});
	const clientCookie = parseSessionCookie(clientRegister.headers.get("set-cookie"));
	if (clientRegister.status !== 201 || !clientCookie) {
		console.error("❌ client register failed");
		process.exit(1);
	}

	console.log("✅ client user ready");

	const join = await fetch(`${baseUrl}/api/user/establishments/join`, {
		method: "POST",
		headers: { "Content-Type": "application/json", ...sessionHeaders(clientCookie) },
		body: JSON.stringify({ slug: targetSlug }),
	});
	const joinBody = (await join.json()) as {
		customer?: { id: string };
		created?: boolean;
	};

	if (join.status !== 201 || !joinBody.customer?.id || joinBody.created !== true) {
		console.error("❌ first join failed", join.status, joinBody);
		process.exit(1);
	}

	console.log("✅ POST join creates customer");

	const rejoin = await fetch(`${baseUrl}/api/user/establishments/join`, {
		method: "POST",
		headers: { "Content-Type": "application/json", ...sessionHeaders(clientCookie) },
		body: JSON.stringify({ slug: targetSlug }),
	});
	const rejoinBody = (await rejoin.json()) as {
		customer?: { id: string };
		created?: boolean;
	};

	if (
		rejoin.status !== 200 ||
		rejoinBody.created !== false ||
		rejoinBody.customer?.id !== joinBody.customer.id
	) {
		console.error("❌ idempotent join failed", rejoin.status, rejoinBody);
		process.exit(1);
	}

	console.log("✅ idempotent join OK");

	const relationships = await fetch(`${baseUrl}/api/user/me/relationships`, {
		headers: sessionHeaders(clientCookie),
	});
	const relBody = (await relationships.json()) as {
		establishments?: { slug: string; pointsBalance: number; visitsCount: number }[];
	};

	if (
		!relationships.ok ||
		relBody.establishments?.length !== 1 ||
		relBody.establishments[0]?.slug !== targetSlug ||
		relBody.establishments[0]?.pointsBalance !== 0
	) {
		console.error("❌ relationships after join", relBody);
		process.exit(1);
	}

	console.log("✅ relationships lists joined local at 0 pts");

	const discover = await fetch(`${baseUrl}/u/home/discover`, { headers: sessionHeaders(clientCookie) });
	const discoverHtml = await discover.text();
	if (discover.status !== 200 || !discoverHtml.includes("Unirme al local")) {
		console.error("❌ discover join form missing");
		process.exit(1);
	}

	console.log("✅ discover page has join form");

	const deepLink = await fetch(`${baseUrl}/u/join/${targetSlug}`, {
		headers: sessionHeaders(clientCookie),
	});
	if (deepLink.status !== 200) {
		console.error("❌ deep link page:", deepLink.status);
		process.exit(1);
	}

	console.log("✅ /u/join/[slug] accessible");

	const clientRow = await prisma.user.findUnique({
		where: { email: clientEmail },
		select: {
			id: true,
			customers: { select: { id: true, userId: true, tenant: { select: { slug: true } } } } },
		},
	});

	if (
		!clientRow?.customers[0]?.userId ||
		clientRow.customers[0].userId !== clientRow.id ||
		clientRow.customers[0].tenant.slug !== targetSlug
	) {
		console.error("❌ DB customer link missing", clientRow);
		process.exit(1);
	}

	console.log("✅ DB: customers.user_id linked");

	const ownerRow = await prisma.user.findUnique({
		where: { email: ownerEmail },
		select: { id: true, memberships: { select: { tenant: { select: { slug: true } } } } } },
	});

	if (!ownerRow?.memberships[0]) {
		console.error("❌ owner cleanup lookup failed");
		process.exit(1);
	}

	await prisma.customer.deleteMany({ where: { userId: clientRow.id } });
	await prisma.tenantMembership.deleteMany({ where: { userId: ownerRow.id } });
	await prisma.tenant.deleteMany({ where: { slug: ownerRow.memberships[0].tenant.slug } });
	await prisma.user.deleteMany({ where: { id: { in: [clientRow.id, ownerRow.id] } } });

	console.log("✅ verify:platform-app-customer-join passed");
}

void main();
