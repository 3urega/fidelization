/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

process.env.DISABLE_TENANT_PLAN_GATES = "0";

import { randomUUID } from "crypto";

import { RULETA_GAME_SLUG } from "../src/contexts/loyalty/games/domain/TenantGameActivation";
import { DEMO_TENANT_ID } from "../src/lib/tenant/mockTenantBySlug";
import { DEMO_ROULETTE_CONFIG } from "../src/lib/roulette/demoRouletteConfig";
import { prisma } from "../src/lib/prisma";
import { ensureDemoTenantActive } from "./lib/customer-verify-helpers";

const baseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000").replace(/\/$/, "");
const PLAN_BASIC_ID = "00000000-0000-4000-8000-000000000004";
const PLAN_PREMIUM_ID = "00000000-0000-4000-8000-000000000007";
const tenantSlug = "cafe-demo";

const pointsSpinConfig = {
	...DEMO_ROULETTE_CONFIG,
	segments: [
		{
			id: "00000000-0000-4000-8000-000000000701",
			label: "+10 puntos",
			weight: 100,
			prizeType: "points" as const,
			prize: { points: 10 },
			stockLimit: null,
			stockUsed: 0,
		},
		{
			id: "00000000-0000-4000-8000-000000000702",
			label: "Sin premio",
			weight: 1,
			prizeType: "none" as const,
			prize: {},
			stockLimit: null,
			stockUsed: 0,
		},
	],
	rules: {
		...DEMO_ROULETTE_CONFIG.rules,
		maxSpinsPerDay: 1,
		maxSpinsPerWeek: 3,
	},
};

function parseSessionCookie(setCookie: string | null): string | null {
	if (!setCookie) {
		return null;
	}

	const match = /session=([^;]+)/.exec(setCookie);

	return match?.[1] ?? null;
}

function sessionHeaders(session: string): Record<string, string> {
	return { cookie: `session=${session}` };
}

async function registerUser(): Promise<string> {
	const email = `verify-roulette-spin-${randomUUID()}@example.local`;
	const password = "password123";

	const register = await fetch(`${baseUrl}/api/auth/register/user`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ name: "Roulette Spin User", email, password }),
	});
	const cookie = parseSessionCookie(register.headers.get("set-cookie"));

	if (register.status !== 201 || !cookie) {
		console.error("❌ register user failed", register.status);
		process.exit(1);
	}

	return cookie;
}

/**
 * E2E: user GET public state + POST spin + establishment detail reflects prize.
 */
async function main(): Promise<void> {
	if (!process.env.DATABASE_URL) {
		console.error("❌ DATABASE_URL required");
		process.exit(1);
	}

	await ensureDemoTenantActive();

	const tenant = await prisma.tenant.findFirst({
		where: { id: DEMO_TENANT_ID },
		select: { id: true, subscriptionPlanId: true },
	});

	if (!tenant) {
		console.error("❌ demo tenant not found");
		process.exit(1);
	}

	const restorePlanId = tenant.subscriptionPlanId ?? PLAN_BASIC_ID;
	const userCookie = await registerUser();
	const headers = {
		"Content-Type": "application/json",
		...sessionHeaders(userCookie),
	};

	const join = await fetch(`${baseUrl}/api/user/establishments/join`, {
		method: "POST",
		headers,
		body: JSON.stringify({ slug: tenantSlug }),
	});

	if (join.status !== 200 && join.status !== 201) {
		console.error("❌ join cafe-demo failed", join.status, await join.json());
		process.exit(1);
	}

	console.log("✅ user joined cafe-demo");

	await prisma.tenant.update({
		where: { id: DEMO_TENANT_ID },
		data: { subscriptionPlanId: PLAN_PREMIUM_ID, subscriptionPlan: "premium" },
	});

	await prisma.tenantGameActivation.upsert({
		where: {
			tenantId_gameSlug: { tenantId: DEMO_TENANT_ID, gameSlug: RULETA_GAME_SLUG },
		},
		create: {
			tenantId: DEMO_TENANT_ID,
			gameSlug: RULETA_GAME_SLUG,
			isEnabled: true,
			config: pointsSpinConfig,
		},
		update: {
			isEnabled: true,
			config: pointsSpinConfig,
		},
	});

	const detailBefore = await fetch(`${baseUrl}/api/user/establishments/${tenantSlug}`, {
		headers: sessionHeaders(userCookie),
	});
	const detailBeforeBody = (await detailBefore.json()) as {
		customer?: { id: string; pointsBalance: number };
	};

	if (!detailBefore.ok || !detailBeforeBody.customer?.id) {
		console.error("❌ GET establishment before spin", detailBefore.status, detailBeforeBody);
		process.exit(1);
	}

	const customerId = detailBeforeBody.customer.id;
	const pointsBefore = detailBeforeBody.customer.pointsBalance;

	console.log("✅ GET establishment detail (before spin)");

	const publicState = await fetch(`${baseUrl}/api/user/establishments/${tenantSlug}/games/ruleta`, {
		headers: sessionHeaders(userCookie),
	});
	const publicBody = (await publicState.json()) as {
		canSpin?: boolean;
		isEnabled?: boolean;
		segments?: unknown[];
	};

	if (!publicState.ok || !publicBody.canSpin || !publicBody.isEnabled) {
		console.error("❌ GET ruleta public state", publicState.status, publicBody);
		process.exit(1);
	}

	console.log("✅ GET ruleta public state");

	const spin = await fetch(`${baseUrl}/api/user/establishments/${tenantSlug}/games/ruleta/spin`, {
		method: "POST",
		headers: sessionHeaders(userCookie),
	});
	const spinBody = (await spin.json()) as {
		spinId?: string;
		segmentIndex?: number;
		segmentLabel?: string;
		prizeType?: string;
		prize?: { points?: number };
		status?: string;
		error?: { type?: string };
	};

	if (
		!spin.ok ||
		!spinBody.spinId ||
		spinBody.prizeType !== "points" ||
		spinBody.prize?.points !== 10 ||
		typeof spinBody.segmentIndex !== "number"
	) {
		console.error("❌ POST spin", spin.status, spinBody);
		process.exit(1);
	}

	console.log("✅ POST spin");

	const spinRow = await prisma.rouletteSpin.findFirst({
		where: { id: spinBody.spinId, tenantId: DEMO_TENANT_ID, customerId },
	});

	if (!spinRow || spinRow.segmentIndex !== spinBody.segmentIndex) {
		console.error("❌ prisma roulette_spins row", spinRow);
		process.exit(1);
	}

	console.log("✅ Prisma roulette_spins persisted");

	const detailAfter = await fetch(`${baseUrl}/api/user/establishments/${tenantSlug}`, {
		headers: sessionHeaders(userCookie),
	});
	const detailAfterBody = (await detailAfter.json()) as {
		customer?: { pointsBalance: number };
	};

	if (
		!detailAfter.ok ||
		detailAfterBody.customer?.pointsBalance !== pointsBefore + 10
	) {
		console.error("❌ points not reflected in detail", detailAfter.status, detailAfterBody);
		process.exit(1);
	}

	console.log("✅ establishment detail reflects points prize");

	const secondSpin = await fetch(`${baseUrl}/api/user/establishments/${tenantSlug}/games/ruleta/spin`, {
		method: "POST",
		headers: sessionHeaders(userCookie),
	});
	const secondBody = (await secondSpin.json()) as { error?: { type?: string } };

	if (secondSpin.status !== 403 || secondBody.error?.type !== "RouletteSpinRateLimitExceeded") {
		console.error("❌ second spin rate limit", secondSpin.status, secondBody);
		process.exit(1);
	}

	console.log("✅ second spin blocked by rate limit");

	await prisma.tenant.update({
		where: { id: DEMO_TENANT_ID },
		data: { subscriptionPlanId: restorePlanId },
	});

	console.log("✅ verify:roulette-spin passed");
}

void main();
