/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { randomUUID } from "crypto";

import { verifyPassword } from "../src/lib/auth/password";
import { prisma } from "../src/lib/prisma";
import { slugifyBusinessName } from "../src/lib/tenant/slugifyBusinessName";

const PLAN_BASIC_ID = "00000000-0000-4000-8000-000000000004";

/**
 * E2E: business onboarding → /onboarding/plan → assign plan → GET /api/me reflects choice.
 */
const baseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000").replace(/\/$/, "");

function parseSessionCookie(setCookie: string | null): string | null {
	if (!setCookie) {
		return null;
	}

	const match = /session=([^;]+)/.exec(setCookie);

	return match?.[1] ?? null;
}

function sessionHeaders(session: string): Record<string, string> {
	return {
		cookie: `session=${session}`,
		"Content-Type": "application/json",
	};
}

async function main(): Promise<void> {
	if (!process.env.DATABASE_URL) {
		console.error("❌ DATABASE_URL required");
		process.exit(1);
	}

	const email = `verify-plan-ui-${randomUUID()}@example.local`;
	const password = "verify-pass-123";

	const step1 = await fetch(`${baseUrl}/api/auth/register/business`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			name: "Verify Plan UI",
			email,
			password,
			confirmPassword: password,
		}),
	});

	const step1Body = (await step1.json()) as { intendedRole?: string; error?: { description?: string } };
	const onboardingCookie = parseSessionCookie(step1.headers.get("set-cookie"));

	if (step1.status !== 201 || !onboardingCookie || step1Body.intendedRole !== "owner") {
		console.error("❌ Step 1 register:", step1.status, step1Body);
		process.exit(1);
	}

	console.log("✅ Step 1: onboarding session");

	const step2 = await fetch(`${baseUrl}/api/auth/register/business/tenant`, {
		method: "POST",
		headers: sessionHeaders(onboardingCookie),
		body: JSON.stringify({
			businessName: "Verify Plan Cafe",
			businessType: "cafe",
		}),
	});

	const step2Body = (await step2.json()) as {
		tenant?: { slug: string; name: string };
		error?: { description?: string };
	};
	const tenantCookie = parseSessionCookie(step2.headers.get("set-cookie"));

	if (step2.status !== 201 || !tenantCookie || !step2Body.tenant?.slug) {
		console.error("❌ Step 2 create tenant:", step2.status, step2Body);
		process.exit(1);
	}

	console.log("✅ Step 2: tenant session");

	const planPage = await fetch(`${baseUrl}/onboarding/plan`, {
		headers: { cookie: `session=${tenantCookie}` },
		redirect: "manual",
	});

	if (planPage.status !== 200) {
		console.error("❌ GET /onboarding/plan:", planPage.status);
		process.exit(1);
	}

	console.log("✅ GET /onboarding/plan → 200");

	const plansResponse = await fetch(`${baseUrl}/api/billing/plans`, {
		headers: { cookie: `session=${tenantCookie}` },
	});
	const plansBody = (await plansResponse.json()) as { plans?: { id: string; name: string }[] };

	if (plansResponse.status !== 200 || !plansBody.plans || plansBody.plans.length < 3) {
		console.error("❌ GET /api/billing/plans:", plansResponse.status, plansBody);
		process.exit(1);
	}

	console.log("✅ GET /api/billing/plans → catalog");

	const assign = await fetch(`${baseUrl}/api/billing/tenant-plan`, {
		method: "PATCH",
		headers: sessionHeaders(tenantCookie),
		body: JSON.stringify({ planId: PLAN_BASIC_ID }),
	});
	const assignBody = (await assign.json()) as {
		tenant?: { subscriptionPlan: string; subscriptionPlanId: string | null };
		error?: { description?: string };
	};

	if (
		assign.status !== 200 ||
		assignBody.tenant?.subscriptionPlan !== "basic" ||
		assignBody.tenant?.subscriptionPlanId !== PLAN_BASIC_ID
	) {
		console.error("❌ PATCH /api/billing/tenant-plan:", assign.status, assignBody);
		process.exit(1);
	}

	console.log("✅ PATCH /api/billing/tenant-plan → basic");

	const me = await fetch(`${baseUrl}/api/me`, {
		headers: { cookie: `session=${tenantCookie}` },
	});
	const meBody = (await me.json()) as {
		tenant?: { subscriptionPlan: string; subscriptionPlanId: string | null };
	};

	if (
		me.status !== 200 ||
		meBody.tenant?.subscriptionPlan !== "basic" ||
		meBody.tenant?.subscriptionPlanId !== PLAN_BASIC_ID
	) {
		console.error("❌ GET /api/me after plan assign:", me.status, meBody);
		process.exit(1);
	}

	console.log("✅ GET /api/me reflects chosen plan");

	const userRow = await prisma.user.findUnique({
		where: { email },
		select: {
			id: true,
			memberships: {
				select: {
					tenant: {
						select: {
							id: true,
							slug: true,
							subscriptionPlan: true,
							subscriptionPlanId: true,
						},
					},
				},
			},
		},
	});

	const tenantRow = userRow?.memberships[0]?.tenant;
	if (
		!userRow ||
		!tenantRow ||
		tenantRow.subscriptionPlan !== "basic" ||
		tenantRow.subscriptionPlanId !== PLAN_BASIC_ID
	) {
		console.error("❌ Prisma tenant plan after assign:", tenantRow);
		process.exit(1);
	}

	console.log("✅ Prisma subscriptionPlanId synced");

	const home = await fetch(`${baseUrl}/home`, {
		headers: { cookie: `session=${tenantCookie}` },
	});

	if (home.status !== 200) {
		console.error("❌ GET /home after plan:", home.status);
		process.exit(1);
	}

	console.log("✅ GET /home after plan selection");

	await prisma.tenantMembership.deleteMany({ where: { userId: userRow.id } });
	await prisma.tenant.deleteMany({ where: { slug: tenantRow.slug } });
	await prisma.user.delete({ where: { id: userRow.id } });

	console.log("✅ verify:onboarding-plan-selection passed");
}

void main();
