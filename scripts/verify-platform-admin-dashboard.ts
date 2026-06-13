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
	const session = await platformLogin();
	const cookieHeader = { cookie: `session=${session}` };

	const dashboard = await fetch(`${baseUrl}/api/platform/dashboard`, { headers: cookieHeader });
	const dashboardBody = (await dashboard.json()) as {
		tenantsActive?: number;
		tenantsSuspended?: number;
		usersRegistered?: number;
		qrScansToday?: number;
		stampsToday?: number;
		activePromotions?: number;
		subscriptionsPastDue?: number;
		recentTenants?: unknown[];
		timezone?: string;
		generatedAt?: string;
	};

	if (
		dashboard.status !== 200 ||
		typeof dashboardBody.tenantsActive !== "number" ||
		typeof dashboardBody.usersRegistered !== "number" ||
		typeof dashboardBody.qrScansToday !== "number" ||
		typeof dashboardBody.stampsToday !== "number" ||
		!Array.isArray(dashboardBody.recentTenants) ||
		!dashboardBody.timezone
	) {
		console.error("❌ GET /api/platform/dashboard", dashboard.status, dashboardBody);
		process.exit(1);
	}

	console.log("✅ GET /api/platform/dashboard OK");

	const unauth = await fetch(`${baseUrl}/api/platform/dashboard`);
	if (unauth.status !== 401) {
		console.error("❌ GET /api/platform/dashboard without session expected 401, got", unauth.status);
		process.exit(1);
	}

	console.log("✅ unauthenticated dashboard → 401");

	const email = `verify-platform-dash-${randomUUID()}@example.local`;
	const password = "password123";
	const register = await fetch(`${baseUrl}/api/auth/register/user`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ name: "Dash Verify User", email, password }),
	});
	const userCookie = parseSessionCookie(register.headers.get("set-cookie"));

	if (register.status !== 201 || !userCookie) {
		console.error("❌ register user for isolation check", register.status);
		process.exit(1);
	}

	const userDashboard = await fetch(`${baseUrl}/api/platform/dashboard`, {
		headers: { cookie: `session=${userCookie}` },
	});

	if (userDashboard.status !== 401) {
		console.error("❌ user session must not access platform dashboard, got", userDashboard.status);
		process.exit(1);
	}

	console.log("✅ user session → 401 on platform dashboard");

	const tenants = await fetch(`${baseUrl}/api/platform/tenants`, { headers: cookieHeader });
	if (tenants.status !== 200) {
		console.error("❌ GET /api/platform/tenants regression", tenants.status);
		process.exit(1);
	}

	console.log("✅ GET /api/platform/tenants regression OK");

	const tenantsPage = await fetch(`${baseUrl}/platform/tenants`, { headers: cookieHeader });
	const tenantsHtml = await tenantsPage.text();

	if (tenantsPage.status !== 200 || !tenantsHtml.includes("Negocios")) {
		console.error("❌ GET /platform/tenants page", tenantsPage.status);
		process.exit(1);
	}

	console.log("✅ GET /platform/tenants page OK");

	const homePage = await fetch(`${baseUrl}/platform`, { headers: cookieHeader });
	const homeHtml = await homePage.text();

	if (homePage.status !== 200 || !homeHtml.includes("Resumen")) {
		console.error("❌ GET /platform home should show KPI dashboard", homePage.status);
		process.exit(1);
	}

	console.log("✅ GET /platform home OK");
	console.log("✅ verify:platform-admin-dashboard passed");
}

void main();
