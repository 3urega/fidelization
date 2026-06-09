/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { randomUUID } from "crypto";

import { prisma } from "../src/lib/prisma";
import { slugifyBusinessName } from "../src/lib/tenant/slugifyBusinessName";

/**
 * E2E: platform user registers a business via app API (issue #40).
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

	const email = `verify-platform-biz-${randomUUID()}@example.local`;
	const password = "password123";
	const businessName = "Verify App Cafe";

	const authGate = await fetch(`${baseUrl}/business/register`);
	if (authGate.status !== 200) {
		console.error("❌ GET /business/register:", authGate.status);
		process.exit(1);
	}

	const authHtml = await authGate.text();
	if (!authHtml.includes("Paso 1 de 2")) {
		console.error("❌ GET /business/register: expected auth gate");
		process.exit(1);
	}

	console.log("✅ GET /business/register auth gate OK");

	const register = await fetch(`${baseUrl}/api/auth/register/user`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ name: "Verify Biz User", email, password }),
	});

	const registerBody = (await register.json()) as { kind?: string };
	const userCookie = parseSessionCookie(register.headers.get("set-cookie"));

	if (register.status !== 201 || registerBody.kind !== "user" || !userCookie) {
		console.error("❌ register user:", register.status, registerBody);
		process.exit(1);
	}

	console.log("✅ user registered with kind user session");

	const skipAuth = await fetch(`${baseUrl}/business/register`, {
		headers: sessionHeaders(userCookie),
		redirect: "manual",
	});

	if (skipAuth.status !== 307 && skipAuth.status !== 308) {
		console.error("❌ authenticated user should skip auth gate:", skipAuth.status);
		process.exit(1);
	}

	const skipLocation = skipAuth.headers.get("location") ?? "";
	if (!skipLocation.includes("/business/register/tenant")) {
		console.error("❌ auth skip redirect:", skipLocation);
		process.exit(1);
	}

	console.log("✅ authenticated user skips auth gate → tenant step");

	const tenantPage = await fetch(`${baseUrl}/business/register/tenant`, {
		headers: sessionHeaders(userCookie),
	});

	if (tenantPage.status !== 200) {
		console.error("❌ GET tenant step:", tenantPage.status);
		process.exit(1);
	}

	const tenantHtml = await tenantPage.text();
	if (!tenantHtml.includes("Nombre del negocio")) {
		console.error("❌ tenant step missing form");
		process.exit(1);
	}

	console.log("✅ GET /business/register/tenant OK");

	const create = await fetch(`${baseUrl}/api/user/businesses`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			...sessionHeaders(userCookie),
		},
		body: JSON.stringify({ businessName, businessType: "cafe" }),
	});

	const createBody = (await create.json()) as {
		kind?: string;
		tenant?: { slug: string; name: string };
		error?: { description?: string };
	};
	const createSetCookie = create.headers.get("set-cookie");

	if (create.status !== 201 || createBody.kind !== "user" || !createBody.tenant?.slug) {
		console.error("❌ POST /api/user/businesses:", create.status, createBody);
		process.exit(1);
	}

	if (createSetCookie?.includes("session=")) {
		console.error("❌ POST /api/user/businesses must not replace session cookie");
		process.exit(1);
	}

	const expectedSlug = slugifyBusinessName(businessName);
	if (
		createBody.tenant.slug !== expectedSlug &&
		!createBody.tenant.slug.startsWith(`${expectedSlug}-`)
	) {
		console.error("❌ unexpected slug:", createBody.tenant.slug, expectedSlug);
		process.exit(1);
	}

	console.log("✅ POST /api/user/businesses → tenant created, session unchanged");

	const me = await fetch(`${baseUrl}/api/user/me`, { headers: sessionHeaders(userCookie) });
	const meBody = (await me.json()) as { kind?: string };

	if (!me.ok || meBody.kind !== "user") {
		console.error("❌ GET /api/user/me after business create:", me.status, meBody);
		process.exit(1);
	}

	console.log("✅ GET /api/user/me still kind user");

	const tenantMe = await fetch(`${baseUrl}/api/me`, { headers: sessionHeaders(userCookie) });
	if (tenantMe.status !== 401) {
		console.error("❌ GET /api/me should be 401 for kind user session:", tenantMe.status);
		process.exit(1);
	}

	console.log("✅ tenant /api/me isolated from user session");

	const relationships = await fetch(`${baseUrl}/api/user/me/relationships`, {
		headers: sessionHeaders(userCookie),
	});
	const relBody = (await relationships.json()) as {
		businesses?: { name: string; slug: string }[];
	};

	if (!relationships.ok || relBody.businesses?.length !== 1 || relBody.businesses[0]?.name !== businessName) {
		console.error("❌ GET /api/user/me/relationships:", relationships.status, relBody);
		process.exit(1);
	}

	console.log("✅ GET /api/user/me/relationships lists business");

	const enter = await fetch(`${baseUrl}/api/user/businesses/${createBody.tenant.slug}/enter`, {
		method: "POST",
		headers: sessionHeaders(userCookie),
	});
	const enterBody = (await enter.json()) as {
		kind?: string;
		redirectUrl?: string;
		tenant?: { slug: string };
		role?: string;
	};
	const tenantCookie = parseSessionCookie(enter.headers.get("set-cookie"));

	if (
		enter.status !== 200 ||
		enterBody.kind !== "tenant" ||
		enterBody.role !== "owner" ||
		!enterBody.redirectUrl ||
		!tenantCookie
	) {
		console.error("❌ POST /api/user/businesses/[slug]/enter:", enter.status, enterBody);
		process.exit(1);
	}

	if (!enterBody.redirectUrl.includes("/panel")) {
		console.error("❌ enter redirectUrl missing /panel:", enterBody.redirectUrl);
		process.exit(1);
	}

	console.log("✅ POST enter → tenant session + redirectUrl");

	const tenantMeAfterEnter = await fetch(`${baseUrl}/api/me`, {
		headers: sessionHeaders(tenantCookie),
	});
	const tenantMeAfterEnterBody = (await tenantMeAfterEnter.json()) as {
		kind?: string;
		tenant?: { slug: string };
	};

	if (
		!tenantMeAfterEnter.ok ||
		tenantMeAfterEnterBody.kind !== "tenant" ||
		tenantMeAfterEnterBody.tenant?.slug !== createBody.tenant.slug
	) {
		console.error(
			"❌ GET /api/me with tenant session:",
			tenantMeAfterEnter.status,
			tenantMeAfterEnterBody,
		);
		process.exit(1);
	}

	console.log("✅ GET /api/me with tenant session after enter");

	const backToUser = await fetch(`${baseUrl}/api/user/enter`, {
		method: "POST",
		headers: sessionHeaders(tenantCookie),
	});
	const backBody = (await backToUser.json()) as {
		kind?: string;
		redirectUrl?: string;
	};
	const restoredUserCookie = parseSessionCookie(backToUser.headers.get("set-cookie"));

	if (
		backToUser.status !== 200 ||
		backBody.kind !== "user" ||
		!backBody.redirectUrl?.includes("/home") ||
		!restoredUserCookie
	) {
		console.error("❌ POST /api/user/enter:", backToUser.status, backBody);
		process.exit(1);
	}

	console.log("✅ POST /api/user/enter → user session + redirectUrl");

	const userMeAfterRestore = await fetch(`${baseUrl}/api/user/me`, {
		headers: sessionHeaders(restoredUserCookie),
	});
	const userMeAfterRestoreBody = (await userMeAfterRestore.json()) as { kind?: string };

	if (!userMeAfterRestore.ok || userMeAfterRestoreBody.kind !== "user") {
		console.error("❌ GET /api/user/me after restore:", userMeAfterRestore.status, userMeAfterRestoreBody);
		process.exit(1);
	}

	console.log("✅ GET /api/user/me after returning to platform app");

	const userRow = await prisma.user.findUnique({
		where: { email },
		select: {
			id: true,
			memberships: {
				select: {
					role: true,
					tenant: { select: { slug: true, businessType: true, name: true } },
				},
			},
		},
	});

	if (!userRow || userRow.memberships.length !== 1) {
		console.error("❌ expected one owner membership");
		process.exit(1);
	}

	const membership = userRow.memberships[0];
	if (membership.role !== "owner" || membership.tenant.businessType !== "cafe") {
		console.error("❌ unexpected membership:", membership);
		process.exit(1);
	}

	const customerCount = await prisma.customer.count({ where: { userId: userRow.id } });
	if (customerCount !== 0) {
		console.error("❌ must not create customers row on business register");
		process.exit(1);
	}

	console.log("✅ DB: owner membership, no customers");

	await prisma.tenantMembership.deleteMany({ where: { userId: userRow.id } });
	await prisma.tenant.deleteMany({ where: { slug: membership.tenant.slug } });
	await prisma.user.delete({ where: { id: userRow.id } });

	console.log("✅ verify:platform-app-register-business passed");
}

void main();
