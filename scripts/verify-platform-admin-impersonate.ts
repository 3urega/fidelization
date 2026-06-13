/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { randomUUID } from "crypto";

import { prisma } from "../src/lib/prisma";

const baseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000").replace(/\/$/, "");
const superadminEmail = process.env.SUPERADMIN_EMAIL?.trim() ?? "superadmin@platform.local";
const superadminPassword = process.env.SUPERADMIN_PASSWORD ?? "change-me-superadmin";

function parseSessionCookie(setCookie: string | null): string | null {
	if (!setCookie) {
		return null;
	}

	const match = /session=([^;]+)/.exec(setCookie);

	return match?.[1] ?? null;
}

async function platformLogin(): Promise<string> {
	const response = await fetch(`${baseUrl}/api/platform/auth/login`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ email: superadminEmail, password: superadminPassword }),
	});

	const session = parseSessionCookie(response.headers.get("set-cookie"));
	if (!response.ok || !session) {
		console.error("❌ platform login failed", response.status);
		process.exit(1);
	}

	return session;
}

async function main(): Promise<void> {
	if (!process.env.DATABASE_URL) {
		console.error("❌ DATABASE_URL required");
		process.exit(1);
	}

	const platformSession = await platformLogin();
	const platformCookie = { cookie: `session=${platformSession}` };

	const list = await fetch(`${baseUrl}/api/platform/tenants`, { headers: platformCookie });
	const listBody = (await list.json()) as {
		tenants?: { id: string; slug: string }[];
	};

	if (!list.ok || !listBody.tenants?.length) {
		console.error("❌ GET /api/platform/tenants", list.status);
		process.exit(1);
	}

	const target = listBody.tenants.find((tenant) => tenant.slug === "cafe-demo") ?? listBody.tenants[0];

	const impersonate = await fetch(`${baseUrl}/api/platform/tenants/${target.id}/impersonate`, {
		method: "POST",
		headers: platformCookie,
	});
	const impersonateBody = (await impersonate.json()) as {
		kind?: string;
		redirectUrl?: string;
		impersonating?: boolean;
		tenant?: { slug?: string };
	};
	const tenantSession = parseSessionCookie(impersonate.headers.get("set-cookie"));

	if (
		impersonate.status !== 200 ||
		impersonateBody.kind !== "tenant" ||
		!impersonateBody.impersonating ||
		!tenantSession ||
		!impersonateBody.redirectUrl?.includes("/panel")
	) {
		console.error("❌ POST impersonate", impersonate.status, impersonateBody);
		process.exit(1);
	}

	console.log("✅ POST impersonate → tenant session + redirectUrl");

	const me = await fetch(`${baseUrl}/api/me`, {
		headers: { cookie: `session=${tenantSession}` },
	});
	const meBody = (await me.json()) as {
		impersonation?: { active?: boolean; tenantSlug?: string; platformUserId?: string };
	};

	if (me.status !== 200 || !meBody.impersonation?.active || meBody.impersonation.tenantSlug !== target.slug) {
		console.error("❌ GET /api/me impersonation", me.status, meBody);
		process.exit(1);
	}

	console.log("✅ GET /api/me includes impersonation.active");

	const auditCount = await prisma.platformImpersonationEvent.count({
		where: { tenantId: target.id },
	});

	if (auditCount < 1) {
		console.error("❌ expected platform_impersonation_events row for tenant", target.id);
		process.exit(1);
	}

	console.log("✅ audit event persisted");

	const end = await fetch(`${baseUrl}/api/platform/impersonation/end`, {
		method: "POST",
		headers: { cookie: `session=${tenantSession}` },
	});
	const endBody = (await end.json()) as { redirectUrl?: string };

	if (end.status !== 200 || endBody.redirectUrl !== "/platform/login") {
		console.error("❌ POST impersonation/end", end.status, endBody);
		process.exit(1);
	}

	console.log("✅ POST impersonation/end clears session");

	const meAfter = await fetch(`${baseUrl}/api/me`);

	if (meAfter.status !== 401) {
		console.error("❌ GET /api/me after end (no cookie) expected 401, got", meAfter.status);
		process.exit(1);
	}

	const platformAfterEnd = await fetch(`${baseUrl}/api/platform/tenants`);

	if (platformAfterEnd.status !== 401) {
		console.error("❌ GET /api/platform/tenants without cookie expected 401, got", platformAfterEnd.status);
		process.exit(1);
	}

	console.log("✅ session cleared — /api/me and platform APIs require login");

	const unauthImpersonate = await fetch(`${baseUrl}/api/platform/tenants/${target.id}/impersonate`, {
		method: "POST",
	});

	if (unauthImpersonate.status !== 401) {
		console.error("❌ unauthenticated impersonate expected 401, got", unauthImpersonate.status);
		process.exit(1);
	}

	console.log("✅ unauthenticated impersonate → 401");

	const email = `verify-impersonate-${randomUUID()}@example.local`;
	const register = await fetch(`${baseUrl}/api/auth/register/user`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ name: "Impersonate Verify", email, password: "password123" }),
	});
	const userCookie = parseSessionCookie(register.headers.get("set-cookie"));

	if (register.status !== 201 || !userCookie) {
		console.error("❌ register user for isolation", register.status);
		process.exit(1);
	}

	const userImpersonate = await fetch(`${baseUrl}/api/platform/tenants/${target.id}/impersonate`, {
		method: "POST",
		headers: { cookie: `session=${userCookie}` },
	});

	if (userImpersonate.status !== 401) {
		console.error("❌ user session must not impersonate, got", userImpersonate.status);
		process.exit(1);
	}

	console.log("✅ user session → 401 on impersonate");
	console.log("✅ verify:platform-admin-impersonate passed");
}

void main();
