/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { randomUUID } from "crypto";

import { prisma } from "../src/lib/prisma";
import { PRO_PLAN_FEATURES } from "../src/contexts/billing/subscriptions/domain/SubscriptionPlanFeatures";

const baseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000").replace(/\/$/, "");
const superadminEmail = process.env.SUPERADMIN_EMAIL?.trim() ?? "superadmin@platform.local";
const superadminPassword = process.env.SUPERADMIN_PASSWORD ?? "change-me-superadmin";
const PLAN_PRO_ID = "00000000-0000-4000-8000-000000000006";

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

	const plans = await fetch(`${baseUrl}/api/platform/features/plans`, { headers: platformCookie });
	const plansBody = (await plans.json()) as {
		plans?: { id: string; name: string; features: Record<string, boolean> }[];
		featureCatalog?: unknown[];
		precedence?: string;
	};

	if (
		plans.status !== 200 ||
		!Array.isArray(plansBody.plans) ||
		plansBody.plans.length < 3 ||
		!plansBody.precedence
	) {
		console.error("❌ GET /api/platform/features/plans", plans.status, plansBody);
		process.exit(1);
	}

	console.log("✅ GET /api/platform/features/plans → catalog");

	const patchPlan = await fetch(`${baseUrl}/api/platform/features/plans`, {
		method: "PATCH",
		headers: { ...platformCookie, "Content-Type": "application/json" },
		body: JSON.stringify({ planId: PLAN_PRO_ID, features: PRO_PLAN_FEATURES }),
	});

	if (patchPlan.status !== 200) {
		console.error("❌ PATCH /api/platform/features/plans", patchPlan.status, await patchPlan.text());
		process.exit(1);
	}

	console.log("✅ PATCH /api/platform/features/plans restores Pro features");

	const tenant = await prisma.tenant.findFirst({ orderBy: { createdAt: "asc" } });
	if (!tenant) {
		console.error("❌ no tenant in database");
		process.exit(1);
	}

	const tenantFeatures = await fetch(`${baseUrl}/api/platform/features/tenants/${tenant.id}`, {
		headers: platformCookie,
	});
	const tenantBody = (await tenantFeatures.json()) as {
		tenantId?: string;
		effectiveFeatures?: Record<string, boolean>;
		planFeatures?: Record<string, boolean>;
	};

	if (tenantFeatures.status !== 200 || tenantBody.tenantId !== tenant.id || !tenantBody.effectiveFeatures) {
		console.error("❌ GET tenant features", tenantFeatures.status, tenantBody);
		process.exit(1);
	}

	console.log("✅ GET /api/platform/features/tenants/[id]");

	const patchTenant = await fetch(`${baseUrl}/api/platform/features/tenants/${tenant.id}`, {
		method: "PATCH",
		headers: { ...platformCookie, "Content-Type": "application/json" },
		body: JSON.stringify({ overrides: { promotions: true } }),
	});
	const patchTenantBody = (await patchTenant.json()) as {
		overrides?: Record<string, boolean>;
		effectiveFeatures?: Record<string, boolean>;
	};

	if (
		patchTenant.status !== 200 ||
		patchTenantBody.overrides?.promotions !== true ||
		!patchTenantBody.effectiveFeatures?.promotions
	) {
		console.error("❌ PATCH tenant features", patchTenant.status, patchTenantBody);
		process.exit(1);
	}

	await prisma.tenant.update({ where: { id: tenant.id }, data: { features: null } });

	console.log("✅ PATCH tenant override + cleanup");

	const unauth = await fetch(`${baseUrl}/api/platform/features/plans`);
	if (unauth.status !== 401) {
		console.error("❌ unauthenticated expected 401, got", unauth.status);
		process.exit(1);
	}

	console.log("✅ unauthenticated → 401");

	const email = `verify-features-${randomUUID()}@example.local`;
	const register = await fetch(`${baseUrl}/api/auth/register/user`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ name: "Features Verify", email, password: "password123" }),
	});
	const userCookie = parseSessionCookie(register.headers.get("set-cookie"));

	if (register.status !== 201 || !userCookie) {
		console.error("❌ register user", register.status);
		process.exit(1);
	}

	const userPlans = await fetch(`${baseUrl}/api/platform/features/plans`, {
		headers: { cookie: `session=${userCookie}` },
	});

	if (userPlans.status !== 401) {
		console.error("❌ user session must not access features API, got", userPlans.status);
		process.exit(1);
	}

	console.log("✅ user session → 401");

	const featuresPage = await fetch(`${baseUrl}/platform/features`, { headers: platformCookie });

	if (featuresPage.status !== 200) {
		console.error("❌ GET /platform/features page", featuresPage.status);
		process.exit(1);
	}

	const html = await featuresPage.text();
	if (
		!html.includes("Feature flags") ||
		!html.includes("Por plan") ||
		!html.includes("Por comercio")
	) {
		console.error("❌ features page missing expected content");
		process.exit(1);
	}

	console.log("✅ GET /platform/features page OK");
	console.log("✅ verify:platform-admin-features passed");
}

void main();
