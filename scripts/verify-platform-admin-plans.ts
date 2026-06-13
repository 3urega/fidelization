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

type PlanJson = {
	id: string;
	name: string;
	priceMonthly: number;
	priceYearly: number;
	features: Record<string, boolean>;
	limits: { employees?: number } | null;
	isActive: boolean;
};

async function main(): Promise<void> {
	if (!process.env.DATABASE_URL) {
		console.error("❌ DATABASE_URL required");
		process.exit(1);
	}

	const platformSession = await platformLogin();
	const platformCookie = { cookie: `session=${platformSession}` };

	const list = await fetch(`${baseUrl}/api/platform/plans`, { headers: platformCookie });
	const listBody = (await list.json()) as { plans?: PlanJson[] };

	if (list.status !== 200 || !listBody.plans || listBody.plans.length < 3) {
		console.error("❌ GET /api/platform/plans", list.status, listBody);
		process.exit(1);
	}

	const proPlan = listBody.plans.find((plan) => plan.id === PLAN_PRO_ID);
	if (!proPlan) {
		console.error("❌ pro plan missing from catalog");
		process.exit(1);
	}

	const originalFeatures = { ...proPlan.features };
	console.log("✅ GET /api/platform/plans → basic/pro/premium");

	const patchedFeatures = {
		...PRO_PLAN_FEATURES,
		gamification: !originalFeatures.gamification,
	};

	const patch = await fetch(`${baseUrl}/api/platform/plans/${PLAN_PRO_ID}`, {
		method: "PATCH",
		headers: {
			...platformCookie,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ features: patchedFeatures }),
	});
	const patchBody = (await patch.json()) as { plan?: PlanJson };

	if (
		patch.status !== 200 ||
		patchBody.plan?.features?.gamification !== patchedFeatures.gamification
	) {
		console.error("❌ PATCH /api/platform/plans/[planId]", patch.status, patchBody);
		process.exit(1);
	}

	console.log("✅ PATCH platform plan updates features");

	const row = await prisma.subscriptionPlan.findUnique({ where: { id: PLAN_PRO_ID } });
	const rowFeatures = row?.features as { gamification?: boolean } | null;

	if (rowFeatures?.gamification !== patchedFeatures.gamification) {
		console.error("❌ Prisma subscription_plans not updated", rowFeatures);
		process.exit(1);
	}

	console.log("✅ Prisma subscription_plans persisted");

	const restore = await fetch(`${baseUrl}/api/platform/plans/${PLAN_PRO_ID}`, {
		method: "PATCH",
		headers: {
			...platformCookie,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ features: originalFeatures }),
	});

	if (restore.status !== 200) {
		console.error("❌ restore pro plan failed", restore.status);
		process.exit(1);
	}

	console.log("✅ restored pro plan features");

	const unauth = await fetch(`${baseUrl}/api/platform/plans`);

	if (unauth.status !== 401) {
		console.error("❌ unauthenticated platform plans expected 401, got", unauth.status);
		process.exit(1);
	}

	const email = `verify-plans-${randomUUID()}@example.local`;
	const register = await fetch(`${baseUrl}/api/auth/register/user`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ name: "Plans Verify", email, password: "password123" }),
	});
	const userCookie = parseSessionCookie(register.headers.get("set-cookie"));

	if (register.status !== 201 || !userCookie) {
		console.error("❌ register user for isolation", register.status);
		process.exit(1);
	}

	const userPlans = await fetch(`${baseUrl}/api/platform/plans`, {
		headers: { cookie: `session=${userCookie}` },
	});

	if (userPlans.status !== 401) {
		console.error("❌ user session must not access platform plans, got", userPlans.status);
		process.exit(1);
	}

	console.log("✅ user session → 401 on platform plans");

	const plansPage = await fetch(`${baseUrl}/platform/plans`, { headers: platformCookie });

	if (plansPage.status !== 200) {
		console.error("❌ GET /platform/plans page expected 200, got", plansPage.status);
		process.exit(1);
	}

	const plansHtml = await plansPage.text();
	if (!plansHtml.includes("Catálogo de planes") || !plansHtml.includes("Basic")) {
		console.error("❌ plans page missing expected content");
		process.exit(1);
	}

	console.log("✅ GET /platform/plans page OK");
	console.log("✅ verify:platform-admin-plans passed");
}

void main();
