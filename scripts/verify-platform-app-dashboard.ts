/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { randomUUID } from "crypto";

import { prisma } from "../src/lib/prisma";

/**
 * E2E: unified dashboard shows owner business and business admin shell (issue #41).
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

	const email = `verify-dashboard-${randomUUID()}@example.local`;
	const password = "password123";
	const businessName = "Verify Dashboard Cafe";

	const register = await fetch(`${baseUrl}/api/auth/register/user`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ name: "Dashboard User", email, password }),
	});

	const userCookie = parseSessionCookie(register.headers.get("set-cookie"));
	if (register.status !== 201 || !userCookie) {
		console.error("❌ register user failed");
		process.exit(1);
	}

	console.log("✅ user session ready");

	const create = await fetch(`${baseUrl}/api/user/businesses`, {
		method: "POST",
		headers: { "Content-Type": "application/json", ...sessionHeaders(userCookie) },
		body: JSON.stringify({ businessName, businessType: "cafe" }),
	});

	const createBody = (await create.json()) as { tenant?: { slug: string; name: string } };
	if (create.status !== 201 || !createBody.tenant?.slug) {
		console.error("❌ create business failed", createBody);
		process.exit(1);
	}

	const slug = createBody.tenant.slug;
	console.log(`✅ business created (${slug})`);

	const relationships = await fetch(`${baseUrl}/api/user/me/relationships`, {
		headers: sessionHeaders(userCookie),
	});
	const relBody = (await relationships.json()) as {
		businesses?: { name: string; subscriptionPlan?: string }[];
		establishments?: unknown[];
	};

	if (
		!relationships.ok ||
		relBody.businesses?.length !== 1 ||
		relBody.businesses[0]?.name !== businessName ||
		!relBody.businesses[0]?.subscriptionPlan
	) {
		console.error("❌ relationships payload incomplete", relBody);
		process.exit(1);
	}

	if (relBody.establishments?.length !== 0) {
		console.error("❌ expected no establishments yet");
		process.exit(1);
	}

	console.log("✅ relationships API lists business with plan");

	const home = await fetch(`${baseUrl}/u/home`, { headers: sessionHeaders(userCookie) });
	const homeHtml = await home.text();

	if (home.status !== 200 || !homeHtml.includes("Mis negocios") || !homeHtml.includes("Mis locales")) {
		console.error("❌ /u/home dashboard sections missing");
		process.exit(1);
	}

	console.log("✅ /u/home renders dashboard sections");

	const businessPage = await fetch(`${baseUrl}/u/home/business/${slug}`, {
		headers: sessionHeaders(userCookie),
	});

	if (businessPage.status !== 200) {
		console.error("❌ business admin shell:", businessPage.status);
		process.exit(1);
	}

	const businessHtml = await businessPage.text();
	if (!businessHtml.includes("Abrir panel del negocio")) {
		console.error("❌ business admin shell missing CTA");
		process.exit(1);
	}

	console.log("✅ /u/home/business/[slug] shell OK");

	const discover = await fetch(`${baseUrl}/u/home/discover`, { headers: sessionHeaders(userCookie) });
	if (discover.status !== 200) {
		console.error("❌ discover page:", discover.status);
		process.exit(1);
	}

	console.log("✅ /u/home/discover OK");

	const userRow = await prisma.user.findUnique({
		where: { email },
		select: { id: true, memberships: { select: { tenant: { select: { slug: true } } } } },
	});

	if (!userRow?.memberships[0]) {
		console.error("❌ missing membership in DB");
		process.exit(1);
	}

	await prisma.tenantMembership.deleteMany({ where: { userId: userRow.id } });
	await prisma.tenant.deleteMany({ where: { slug: userRow.memberships[0].tenant.slug } });
	await prisma.user.delete({ where: { id: userRow.id } });

	console.log("✅ verify:platform-app-dashboard passed");
}

void main();
