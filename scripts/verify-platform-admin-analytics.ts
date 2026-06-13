/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { randomUUID } from "crypto";

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

	const startedAt = Date.now();
	const summary7 = await fetch(`${baseUrl}/api/platform/analytics/summary?periodDays=7`, {
		headers: platformCookie,
	});
	const body7 = (await summary7.json()) as {
		periodDays?: number;
		platformTotals?: {
			tenantsActive?: number;
			qrScans?: number;
			stampsIssued?: number;
			rewardsRedeemed?: number;
		};
		topTenantsByQrScans?: unknown[];
		topTenantsByStamps?: unknown[];
		topTenantsByRewardsRedeemed?: unknown[];
		periodStart?: string;
		timezone?: string;
	};

	if (
		summary7.status !== 200 ||
		body7.periodDays !== 7 ||
		typeof body7.platformTotals?.tenantsActive !== "number" ||
		typeof body7.platformTotals.qrScans !== "number" ||
		!Array.isArray(body7.topTenantsByQrScans) ||
		!body7.periodStart ||
		!body7.timezone
	) {
		console.error("❌ GET analytics summary 7d", summary7.status, body7);
		process.exit(1);
	}

	const elapsedMs = Date.now() - startedAt;
	if (elapsedMs > 2000) {
		console.error("❌ analytics summary took too long", elapsedMs);
		process.exit(1);
	}

	console.log(`✅ GET /api/platform/analytics/summary?periodDays=7 (${elapsedMs}ms)`);

	const summary30 = await fetch(`${baseUrl}/api/platform/analytics/summary?periodDays=30`, {
		headers: platformCookie,
	});

	if (summary30.status !== 200) {
		console.error("❌ GET analytics summary 30d", summary30.status);
		process.exit(1);
	}

	console.log("✅ GET /api/platform/analytics/summary?periodDays=30");

	const unauth = await fetch(`${baseUrl}/api/platform/analytics/summary`);
	if (unauth.status !== 401) {
		console.error("❌ unauthenticated expected 401, got", unauth.status);
		process.exit(1);
	}

	console.log("✅ unauthenticated → 401");

	const email = `verify-analytics-${randomUUID()}@example.local`;
	const register = await fetch(`${baseUrl}/api/auth/register/user`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ name: "Analytics Verify", email, password: "password123" }),
	});
	const userCookie = parseSessionCookie(register.headers.get("set-cookie"));

	if (register.status !== 201 || !userCookie) {
		console.error("❌ register user", register.status);
		process.exit(1);
	}

	const userSummary = await fetch(`${baseUrl}/api/platform/analytics/summary`, {
		headers: { cookie: `session=${userCookie}` },
	});

	if (userSummary.status !== 401) {
		console.error("❌ user session must not access analytics, got", userSummary.status);
		process.exit(1);
	}

	console.log("✅ user session → 401");

	const analyticsPage = await fetch(`${baseUrl}/platform/analytics`, { headers: platformCookie });

	if (analyticsPage.status !== 200) {
		console.error("❌ GET /platform/analytics page", analyticsPage.status);
		process.exit(1);
	}

	const html = await analyticsPage.text();
	if (
		!html.includes("Analítica") ||
		!html.includes("Últimos 7 días") ||
		!html.includes("Top negocios")
	) {
		console.error("❌ analytics page missing expected content");
		process.exit(1);
	}

	console.log("✅ GET /platform/analytics page OK");
	console.log("✅ verify:platform-admin-analytics passed");
}

void main();
