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

	const overview = await fetch(`${baseUrl}/api/platform/billing/overview`, {
		headers: platformCookie,
	});
	const overviewBody = (await overview.json()) as {
		mrrCents?: number;
		mrrFormula?: string;
		activeSubscriptions?: number;
		pastDueCount?: number;
		billingSuspendedTenants?: number;
		subscriptions?: unknown[];
		generatedAt?: string;
	};

	if (
		overview.status !== 200 ||
		typeof overviewBody.mrrCents !== "number" ||
		!overviewBody.mrrFormula ||
		typeof overviewBody.activeSubscriptions !== "number" ||
		typeof overviewBody.pastDueCount !== "number" ||
		typeof overviewBody.billingSuspendedTenants !== "number" ||
		!Array.isArray(overviewBody.subscriptions) ||
		!overviewBody.generatedAt
	) {
		console.error("❌ GET /api/platform/billing/overview", overview.status, overviewBody);
		process.exit(1);
	}

	console.log("✅ GET /api/platform/billing/overview → metrics + subscriptions[]");

	const unauth = await fetch(`${baseUrl}/api/platform/billing/overview`);

	if (unauth.status !== 401) {
		console.error("❌ unauthenticated billing overview expected 401, got", unauth.status);
		process.exit(1);
	}

	console.log("✅ unauthenticated → 401");

	const email = `verify-billing-${randomUUID()}@example.local`;
	const register = await fetch(`${baseUrl}/api/auth/register/user`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ name: "Billing Verify", email, password: "password123" }),
	});
	const userCookie = parseSessionCookie(register.headers.get("set-cookie"));

	if (register.status !== 201 || !userCookie) {
		console.error("❌ register user for isolation", register.status);
		process.exit(1);
	}

	const userOverview = await fetch(`${baseUrl}/api/platform/billing/overview`, {
		headers: { cookie: `session=${userCookie}` },
	});

	if (userOverview.status !== 401) {
		console.error("❌ user session must not access billing overview, got", userOverview.status);
		process.exit(1);
	}

	console.log("✅ user session → 401 on billing overview");

	const billingPage = await fetch(`${baseUrl}/platform/billing`, { headers: platformCookie });

	if (billingPage.status !== 200) {
		console.error("❌ GET /platform/billing page expected 200, got", billingPage.status);
		process.exit(1);
	}

	const billingHtml = await billingPage.text();
	if (
		!billingHtml.includes("Facturación") ||
		!billingHtml.includes("MRR estimado") ||
		!billingHtml.includes("Suscripciones")
	) {
		console.error("❌ billing page missing expected content");
		process.exit(1);
	}

	console.log("✅ GET /platform/billing page OK");
	console.log("✅ verify:platform-admin-billing passed");
}

void main();
