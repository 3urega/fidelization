/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { randomUUID } from "crypto";

import { PlanFeatureNotAvailable } from "../src/contexts/billing/subscriptions/domain/PlanFeatureNotAvailable";
import {
	PREMIUM_PLAN_FEATURES,
	type SubscriptionPlanFeatures,
} from "../src/contexts/billing/subscriptions/domain/SubscriptionPlanFeatures";
import { SubscriptionPlan } from "../src/contexts/billing/subscriptions/domain/SubscriptionPlan";
import { GetTenantRouletteConfig } from "../src/contexts/loyalty/games/application/config/GetTenantRouletteConfig";
import { AuthorizeRouletteSpin } from "../src/contexts/loyalty/games/application/participation/AuthorizeRouletteSpin";
import { ResolveRouletteParticipationUsage } from "../src/contexts/loyalty/games/application/participation/ResolveRouletteParticipationUsage";
import { RouletteParticipation } from "../src/contexts/loyalty/games/domain/RouletteParticipation";
import { RouletteParticipationRepository } from "../src/contexts/loyalty/games/domain/RouletteParticipationRepository";
import { RouletteSpinEligibility } from "../src/contexts/loyalty/games/domain/RouletteSpinEligibility";
import { RouletteSpinEligibilityRepository } from "../src/contexts/loyalty/games/domain/RouletteSpinEligibilityRepository";
import { RouletteSpinRepository } from "../src/contexts/loyalty/games/domain/RouletteSpinRepository";
import {
	RULETA_GAME_SLUG,
	TenantGameActivation,
} from "../src/contexts/loyalty/games/domain/TenantGameActivation";
import type { RouletteConfigPrimitives } from "../src/contexts/loyalty/games/domain/RouletteConfig";
import { TenantGameActivationRepository } from "../src/contexts/loyalty/games/domain/TenantGameActivationRepository";
import { PlatformGame } from "../src/contexts/platform/domain/PlatformGame";
import { PlatformGameRepository } from "../src/contexts/platform/domain/PlatformGameRepository";
import { DEMO_ROULETTE_CONFIG } from "../src/lib/roulette/demoRouletteConfig";
import { DEMO_TENANT_ID } from "../src/lib/tenant/mockTenantBySlug";
import { prisma } from "../src/lib/prisma";
import { apexBaseUrl, ensureDemoTenantActive, tenantSlug } from "./lib/customer-verify-helpers";

const PLAN_PREMIUM_ID = "00000000-0000-4000-8000-000000000007";
const gameId = "00000000-0000-4000-8000-000000000030";

class PrismaBackedParticipationRepository extends RouletteParticipationRepository {
	async save(participation: RouletteParticipation): Promise<void> {
		const p = participation.toPrimitives();

		await prisma.rouletteParticipation.upsert({
			where: {
				tenantId_customerId: { tenantId: p.tenantId, customerId: p.customerId },
			},
			create: {
				id: p.id,
				tenantId: p.tenantId,
				customerId: p.customerId,
				enrolledAt: new Date(p.enrolledAt),
				periodEndsAt: new Date(p.periodEndsAt),
				status: p.status,
			},
			update: {
				enrolledAt: new Date(p.enrolledAt),
				periodEndsAt: new Date(p.periodEndsAt),
				status: p.status,
			},
		});
	}

	async findByTenantAndCustomer(
		tenantIdValue: string,
		customerIdValue: string,
	): Promise<RouletteParticipation | null> {
		const row = await prisma.rouletteParticipation.findUnique({
			where: {
				tenantId_customerId: { tenantId: tenantIdValue, customerId: customerIdValue },
			},
		});

		if (!row) {
			return null;
		}

		return RouletteParticipation.fromPrimitives({
			id: row.id,
			tenantId: row.tenantId,
			customerId: row.customerId,
			enrolledAt: row.enrolledAt.toISOString(),
			periodEndsAt: row.periodEndsAt.toISOString(),
			status: row.status as "active" | "quota_exhausted" | "period_expired",
		});
	}
}

class PrismaBackedSpinRepository extends RouletteSpinRepository {
	async save(): Promise<void> {}

	async searchById(): Promise<null> {
		return null;
	}

	async countByCustomerSince(
		tenantIdValue: string,
		customerIdValue: string,
		since: Date,
	): Promise<number> {
		return prisma.rouletteSpin.count({
			where: {
				tenantId: tenantIdValue,
				customerId: customerIdValue,
				createdAt: { gte: since },
			},
		});
	}

	async countByCustomerBetween(
		tenantIdValue: string,
		customerIdValue: string,
		start: Date,
		end: Date,
	): Promise<number> {
		return prisma.rouletteSpin.count({
			where: {
				tenantId: tenantIdValue,
				customerId: customerIdValue,
				createdAt: { gte: start, lt: end },
			},
		});
	}

	async listPendingRedeemByCustomer(): Promise<never[]> {
		return [];
	}

	async listRecentByCustomer(): Promise<never[]> {
		return [];
	}
}

class PrismaBackedEligibilityRepository extends RouletteSpinEligibilityRepository {
	async save(eligibility: RouletteSpinEligibility): Promise<void> {
		const p = eligibility.toPrimitives();

		await prisma.rouletteSpinEligibility.upsert({
			where: { id: p.id },
			create: {
				id: p.id,
				tenantId: p.tenantId,
				customerId: p.customerId,
				expiresAt: new Date(p.expiresAt),
				triggerRef: p.triggerRef,
				authorizedPurchaseEuros: p.authorizedPurchaseEuros,
				createdAt: new Date(p.createdAt),
				consumedAt: p.consumedAt ? new Date(p.consumedAt) : null,
			},
			update: {
				expiresAt: new Date(p.expiresAt),
				triggerRef: p.triggerRef,
				authorizedPurchaseEuros: p.authorizedPurchaseEuros,
				consumedAt: p.consumedAt ? new Date(p.consumedAt) : null,
			},
		});
	}

	async findActiveByCustomer(
		tenantIdValue: string,
		customerIdValue: string,
		at: Date = new Date(),
	): Promise<RouletteSpinEligibility | null> {
		const row = await this.findUnconsumedByCustomer(tenantIdValue, customerIdValue);

		if (!row || !row.isActive(at)) {
			return null;
		}

		return row;
	}

	async findUnconsumedByCustomer(
		tenantIdValue: string,
		customerIdValue: string,
	): Promise<RouletteSpinEligibility | null> {
		const row = await prisma.rouletteSpinEligibility.findFirst({
			where: {
				tenantId: tenantIdValue,
				customerId: customerIdValue,
				consumedAt: null,
			},
			orderBy: { createdAt: "desc" },
		});

		if (!row) {
			return null;
		}

		return RouletteSpinEligibility.fromPrimitives({
			id: row.id,
			tenantId: row.tenantId,
			customerId: row.customerId,
			expiresAt: row.expiresAt.toISOString(),
			triggerRef: row.triggerRef,
			authorizedPurchaseEuros: row.authorizedPurchaseEuros,
			createdAt: row.createdAt.toISOString(),
			consumedAt: row.consumedAt?.toISOString() ?? null,
		});
	}

	async countUnconsumedCreatedBetween(
		tenantIdValue: string,
		customerIdValue: string,
		start: Date,
		end: Date,
	): Promise<number> {
		return prisma.rouletteSpinEligibility.count({
			where: {
				tenantId: tenantIdValue,
				customerId: customerIdValue,
				consumedAt: null,
				createdAt: { gte: start, lt: end },
			},
		});
	}
}

class PrismaBackedActivationRepository extends TenantGameActivationRepository {
	async searchByTenantAndSlug(
		tenantIdValue: string,
		gameSlug: string,
	): Promise<TenantGameActivation | null> {
		const row = await prisma.tenantGameActivation.findUnique({
			where: { tenantId_gameSlug: { tenantId: tenantIdValue, gameSlug } },
		});

		if (!row) {
			return null;
		}

		return TenantGameActivation.fromPrimitives({
			id: row.id,
			tenantId: row.tenantId,
			gameSlug: row.gameSlug,
			isEnabled: row.isEnabled,
			config: row.config as RouletteConfigPrimitives,
		});
	}

	async save(): Promise<void> {}
}

class StubPlatformGameRepository extends PlatformGameRepository {
	constructor(private readonly game: PlatformGame | null) {
		super();
	}

	async list(): Promise<PlatformGame[]> {
		return this.game ? [this.game] : [];
	}

	async searchById(id: string): Promise<PlatformGame | null> {
		return this.game?.toPrimitives().id === id ? this.game : null;
	}

	async searchBySlug(slug: string): Promise<PlatformGame | null> {
		return slug === RULETA_GAME_SLUG ? this.game : null;
	}

	async save(): Promise<void> {
		throw new Error("not implemented");
	}

	async maxSortOrder(): Promise<number> {
		return 0;
	}
}

class StubAssertTenantPlanFeature {
	constructor(private readonly features: SubscriptionPlanFeatures) {}

	async execute(params: { tenantId: string; feature: "gamification" | "promotions" }): Promise<SubscriptionPlan> {
		if (params.feature === "gamification" && !this.features.gamification) {
			throw new PlanFeatureNotAvailable(params.tenantId, params.feature);
		}

		return SubscriptionPlan.fromPrimitives({
			id: "plan-premium",
			name: "premium",
			priceMonthly: 0,
			priceYearly: 0,
			features: this.features,
			limits: { employees: 50 },
			isActive: true,
		});
	}
}

function buildAuthorizeRouletteSpin(): AuthorizeRouletteSpin {
	const activationRepository = new PrismaBackedActivationRepository();
	const participationRepository = new PrismaBackedParticipationRepository();
	const spinRepository = new PrismaBackedSpinRepository();
	const eligibilityRepository = new PrismaBackedEligibilityRepository();
	const getConfig = new GetTenantRouletteConfig(activationRepository);
	const resolveUsage = new ResolveRouletteParticipationUsage(spinRepository, eligibilityRepository);

	return new AuthorizeRouletteSpin(
		new StubAssertTenantPlanFeature(PREMIUM_PLAN_FEATURES) as never,
		new StubPlatformGameRepository(
			PlatformGame.fromPrimitives({
				id: gameId,
				slug: RULETA_GAME_SLUG,
				label: "Ruleta",
				description: "",
				status: "active",
				requiredFeature: "gamification",
				sortOrder: 1,
			}),
		),
		getConfig,
		participationRepository,
		eligibilityRepository,
		resolveUsage,
	);
}

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
	const email = `verify-client-roulette-${randomUUID()}@example.local`;
	const password = "password123";

	const register = await fetch(`${apexBaseUrl}/api/auth/register/user`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ name: "Client Roulette User", email, password }),
	});
	const cookie = parseSessionCookie(register.headers.get("set-cookie"));

	if (register.status !== 201 || !cookie) {
		console.error("❌ register user failed", register.status);
		process.exit(1);
	}

	return cookie;
}

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

	const restorePlanId = tenant.subscriptionPlanId;

	await prisma.tenant.update({
		where: { id: DEMO_TENANT_ID },
		data: { subscriptionPlanId: PLAN_PREMIUM_ID, subscriptionPlan: "premium" },
	});

	await prisma.tenantGameActivation.upsert({
		where: { tenantId_gameSlug: { tenantId: DEMO_TENANT_ID, gameSlug: RULETA_GAME_SLUG } },
		create: {
			tenantId: DEMO_TENANT_ID,
			gameSlug: RULETA_GAME_SLUG,
			isEnabled: true,
			config: DEMO_ROULETTE_CONFIG,
		},
		update: { isEnabled: true, config: DEMO_ROULETTE_CONFIG },
	});

	const cookie = await registerUser();

	const join = await fetch(`${apexBaseUrl}/api/user/establishments/join`, {
		method: "POST",
		headers: { "Content-Type": "application/json", ...sessionHeaders(cookie) },
		body: JSON.stringify({ slug: tenantSlug }),
	});

	if (join.status !== 200 && join.status !== 201) {
		console.error("❌ join establishment failed", join.status);
		process.exit(1);
	}

	console.log("✅ user joined cafe-demo");

	const detail = await fetch(`${apexBaseUrl}/api/user/establishments/${tenantSlug}`, {
		headers: sessionHeaders(cookie),
	});
	const detailBody = (await detail.json()) as { customer?: { id: string } };

	if (!detail.ok || !detailBody.customer?.id) {
		console.error("❌ GET establishment detail", detail.status, detailBody);
		process.exit(1);
	}

	const customerId = detailBody.customer.id;

	const beforeEnroll = await fetch(
		`${apexBaseUrl}/api/user/establishments/${tenantSlug}/games/ruleta`,
		{ headers: sessionHeaders(cookie) },
	);
	const beforeBody = (await beforeEnroll.json()) as {
		authorizationMode?: string;
		participationStatus?: string;
		canSpin?: boolean;
		segments?: unknown[];
	};

	if (
		!beforeEnroll.ok ||
		beforeBody.authorizationMode !== "staff_explicit" ||
		beforeBody.participationStatus !== "not_enrolled" ||
		beforeBody.canSpin !== false ||
		!beforeBody.segments?.length
	) {
		console.error("❌ GET ruleta before enroll", beforeEnroll.status, beforeBody);
		process.exit(1);
	}

	console.log("✅ GET ruleta not_enrolled with segments");

	const enroll = await fetch(
		`${apexBaseUrl}/api/user/establishments/${tenantSlug}/games/ruleta/enroll`,
		{ method: "POST", headers: sessionHeaders(cookie) },
	);
	const enrollBody = (await enroll.json()) as {
		participationId?: string;
		status?: string;
		error?: { description?: string };
	};

	if (!enroll.ok || enrollBody.status !== "active" || !enrollBody.participationId) {
		console.error("❌ POST enroll", enroll.status, enrollBody);
		process.exit(1);
	}

	console.log("✅ POST enroll");

	const afterEnroll = await fetch(
		`${apexBaseUrl}/api/user/establishments/${tenantSlug}/games/ruleta`,
		{ headers: sessionHeaders(cookie) },
	);
	const afterBody = (await afterEnroll.json()) as {
		participationStatus?: string;
		canSpin?: boolean;
		blockReason?: string;
		conditionsLabel?: string | null;
	};

	if (
		!afterEnroll.ok ||
		afterBody.participationStatus !== "active" ||
		afterBody.canSpin !== false ||
		afterBody.blockReason !== "awaiting_staff_authorization" ||
		afterBody.conditionsLabel !== "Mín. 10€ en caja"
	) {
		console.error("❌ GET ruleta after enroll", afterEnroll.status, afterBody);
		process.exit(1);
	}

	console.log("✅ GET ruleta active without spin permission");

	const secondEnroll = await fetch(
		`${apexBaseUrl}/api/user/establishments/${tenantSlug}/games/ruleta/enroll`,
		{ method: "POST", headers: sessionHeaders(cookie) },
	);

	if (secondEnroll.status !== 200) {
		console.error("❌ second enroll should be idempotent", secondEnroll.status);
		process.exit(1);
	}

	console.log("✅ POST enroll idempotent");

	await buildAuthorizeRouletteSpin().execute({
		tenantId: DEMO_TENANT_ID,
		customerId,
		purchaseAmountEuros: 15,
		triggerRef: "verify-client-participation",
	});

	const afterAuth = await fetch(
		`${apexBaseUrl}/api/user/establishments/${tenantSlug}/games/ruleta`,
		{ headers: sessionHeaders(cookie) },
	);
	const authBody = (await afterAuth.json()) as {
		participationStatus?: string;
		canSpin?: boolean;
		eligibility?: { expiresAt: string } | null;
	};

	if (
		!afterAuth.ok ||
		authBody.participationStatus !== "authorized_ready" ||
		authBody.canSpin !== true ||
		!authBody.eligibility?.expiresAt
	) {
		console.error("❌ GET ruleta after authorization", afterAuth.status, authBody);
		process.exit(1);
	}

	console.log("✅ GET ruleta authorized_ready");

	const spin = await fetch(
		`${apexBaseUrl}/api/user/establishments/${tenantSlug}/games/ruleta/spin`,
		{ method: "POST", headers: sessionHeaders(cookie) },
	);
	const spinBody = (await spin.json()) as { spinId?: string; error?: { description?: string } };

	if (!spin.ok || !spinBody.spinId) {
		console.error("❌ POST spin", spin.status, spinBody);
		process.exit(1);
	}

	console.log("✅ POST spin");

	const withHistory = await fetch(
		`${apexBaseUrl}/api/user/establishments/${tenantSlug}/games/ruleta`,
		{ headers: sessionHeaders(cookie) },
	);
	const historyBody = (await withHistory.json()) as {
		recentSpins?: { spinId: string; segmentLabel: string; prizeSummary: string; status: string }[];
	};

	if (!withHistory.ok || !historyBody.recentSpins?.length) {
		console.error("❌ GET ruleta recentSpins", withHistory.status, historyBody);
		process.exit(1);
	}

	console.log("✅ GET ruleta recentSpins");

	const detailPage = await fetch(`${apexBaseUrl}/home/establishments/${tenantSlug}`, {
		headers: sessionHeaders(cookie),
	});

	if (detailPage.status !== 200) {
		console.error("❌ GET establishment detail page", detailPage.status);
		process.exit(1);
	}

	const detailHtml = await detailPage.text();

	if (!detailHtml.includes("Ruleta de premios")) {
		console.error("❌ establishment detail missing roulette card");
		process.exit(1);
	}

	console.log("✅ establishment detail shows roulette card");

	await prisma.tenant.update({
		where: { id: DEMO_TENANT_ID },
		data: { subscriptionPlanId: restorePlanId },
	});

	console.log("\n✅ verify:roulette-client-participation passed");
}

void main();
