/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { randomUUID } from "crypto";

import { verifyPassword } from "../src/lib/auth/password";
import { prisma } from "../src/lib/prisma";
import { slugifyBusinessName } from "../src/lib/tenant/slugifyBusinessName";

/**
 * E2E check: full business onboarding wizard (step 1 onboarding session → step 2 tenant session → /home).
 * Requires dev server at NEXT_PUBLIC_API_URL and DATABASE_URL.
 */
const baseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000").replace(/\/$/, "");

function parseSessionCookie(setCookie: string | null): string | null {
	if (!setCookie) {
		return null;
	}

	const match = /session=([^;]+)/.exec(setCookie);

	return match?.[1] ?? null;
}

function sessionHeaders(session: string): { headers: { cookie: string } } {
	return { headers: { cookie: `session=${session}` } };
}

async function main(): Promise<void> {
	if (!process.env.DATABASE_URL) {
		console.error("❌ DATABASE_URL required");
		process.exit(1);
	}

	const email = `verify-onboarding-${randomUUID()}@example.local`;
	const password = "verify-pass-123";

	const step1 = await fetch(`${baseUrl}/api/auth/register/business`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			name: "Verify Onboarding",
			email,
			password,
			confirmPassword: password,
		}),
	});

	const step1Body = (await step1.json()) as {
		user?: { id: string; email: string };
		intendedRole?: string;
		error?: { description?: string };
	};
	const onboardingCookie = parseSessionCookie(step1.headers.get("set-cookie"));

	if (step1.status !== 201 || !onboardingCookie || step1Body.intendedRole !== "owner") {
		console.error("❌ Step 1 register:", step1.status, step1Body);
		process.exit(1);
	}

	console.log("✅ Step 1: user + onboarding session cookie");

	const homeBlocked = await fetch(`${baseUrl}/home`, {
		headers: { cookie: `session=${onboardingCookie}` },
		redirect: "manual",
	});
	const homeBlockedLocation = homeBlocked.headers.get("location") ?? "";
	if (
		(homeBlocked.status !== 307 && homeBlocked.status !== 308) ||
		!homeBlockedLocation.includes("/register/business/tenant")
	) {
		console.error("❌ Onboarding session must not access /home yet:", homeBlocked.status, homeBlockedLocation);
		process.exit(1);
	}

	console.log("✅ Onboarding session blocked from /home");

	const tenantPage = await fetch(`${baseUrl}/register/business/tenant`, sessionHeaders(onboardingCookie));

	if (tenantPage.status !== 200) {
		console.error("❌ GET /register/business/tenant:", tenantPage.status);
		process.exit(1);
	}

	console.log("✅ Step 2 page accessible with onboarding session");

	const step2 = await fetch(`${baseUrl}/api/auth/register/business/tenant`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			cookie: `session=${onboardingCookie}`,
		},
		body: JSON.stringify({
			businessName: "Verify Cafe",
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

	const expectedSlug = slugifyBusinessName("Verify Cafe");
	if (step2Body.tenant.slug !== expectedSlug && !step2Body.tenant.slug.startsWith(`${expectedSlug}-`)) {
		console.error("❌ Tenant slug should match slugify(businessName):", step2Body.tenant.slug, expectedSlug);
		process.exit(1);
	}

	console.log("✅ Step 2: tenant created, tenant session cookie set");
	console.log(`✅ Tenant slug: ${step2Body.tenant.slug}`);

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
		console.error("❌ Expected one membership for user");
		process.exit(1);
	}

	const membership = userRow.memberships[0];
	if (membership.role !== "owner" || membership.tenant.businessType !== "cafe") {
		console.error("❌ Unexpected membership:", membership);
		process.exit(1);
	}

	const passwordRow = await prisma.user.findUnique({
		where: { email },
		select: { passwordHash: true },
	});
	if (!passwordRow || !(await verifyPassword(password, passwordRow.passwordHash))) {
		console.error("❌ Password hash invalid");
		process.exit(1);
	}

	console.log("✅ DB: owner membership + business_type persisted");

	const home = await fetch(`${baseUrl}/home`, {
		...sessionHeaders(tenantCookie),
		redirect: "manual",
	});

	if (home.status === 307 || home.status === 308) {
		const location = home.headers.get("location") ?? "";
		if (location.includes("/login")) {
			console.error("❌ GET /home redirected to login after onboarding complete");
			process.exit(1);
		}
	}

	if (home.status !== 200) {
		console.error("❌ GET /home:", home.status);
		process.exit(1);
	}

	console.log("✅ GET /home OK with tenant session");

	const planPage = await fetch(`${baseUrl}/onboarding/plan`, {
		headers: { cookie: `session=${tenantCookie}` },
	});

	if (planPage.status !== 200) {
		console.error("❌ GET /onboarding/plan:", planPage.status);
		process.exit(1);
	}

	console.log("✅ GET /onboarding/plan OK for new tenant");

	await prisma.tenantMembership.deleteMany({ where: { userId: userRow.id } });
	await prisma.tenant.deleteMany({ where: { slug: membership.tenant.slug } });
	await prisma.user.delete({ where: { id: userRow.id } });

	console.log("✅ verify:business-onboarding passed");
}

void main();
