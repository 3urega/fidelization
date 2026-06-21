/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { PlanFeatureNotAvailable } from "../src/contexts/billing/subscriptions/domain/PlanFeatureNotAvailable";
import {
	BASIC_PLAN_FEATURES,
	PREMIUM_PLAN_FEATURES,
	type SubscriptionPlanFeatures,
} from "../src/contexts/billing/subscriptions/domain/SubscriptionPlanFeatures";
import { SubscriptionPlan } from "../src/contexts/billing/subscriptions/domain/SubscriptionPlan";
import { IssueRouletteSpinEligibility } from "../src/contexts/loyalty/games/application/eligibility/IssueRouletteSpinEligibility";
import { GetTenantRouletteConfig } from "../src/contexts/loyalty/games/application/config/GetTenantRouletteConfig";
import { AssertRouletteSpinAccess } from "../src/contexts/loyalty/games/application/spin/AssertRouletteSpinAccess";
import { ExecuteRouletteSpin } from "../src/contexts/loyalty/games/application/spin/ExecuteRouletteSpin";
import { GetRoulettePublicState } from "../src/contexts/loyalty/games/application/spin/GetRoulettePublicState";
import { RouletteSpinEligibility } from "../src/contexts/loyalty/games/domain/RouletteSpinEligibility";
import { RouletteSpinEligibilityRepository } from "../src/contexts/loyalty/games/domain/RouletteSpinEligibilityRepository";
import { RouletteSpinNotEligible } from "../src/contexts/loyalty/games/domain/RouletteSpinNotEligible";
import { RouletteSpinRepository } from "../src/contexts/loyalty/games/domain/RouletteSpinRepository";
import { RouletteSpinUnitOfWork } from "../src/contexts/loyalty/games/domain/RouletteSpinUnitOfWork";
import {
	RULETA_GAME_SLUG,
	TenantGameActivation,
} from "../src/contexts/loyalty/games/domain/TenantGameActivation";
import { TenantGameActivationRepository } from "../src/contexts/loyalty/games/domain/TenantGameActivationRepository";
import { parseRouletteConfig } from "../src/contexts/loyalty/games/domain/RouletteConfig";
import { PlatformGame } from "../src/contexts/platform/domain/PlatformGame";
import { PlatformGameRepository } from "../src/contexts/platform/domain/PlatformGameRepository";

const tenantId = "00000000-0000-4000-8000-0000000000e1";
const customerId = "00000000-0000-4000-8000-0000000000e2";
const userId = "00000000-0000-4000-8000-0000000000e3";
const gameId = "00000000-0000-4000-8000-000000000030";

const scanTriggerConfig = parseRouletteConfig({
	version: 1,
	segments: [
		{
			id: "00000000-0000-4000-8000-000000000e01",
			label: "+5 puntos",
			weight: 100,
			prizeType: "points",
			prize: { points: 5 },
			stockLimit: null,
			stockUsed: 0,
		},
		{
			id: "00000000-0000-4000-8000-000000000e02",
			label: "Sin premio",
			weight: 1,
			prizeType: "none",
			prize: {},
			stockLimit: null,
			stockUsed: 0,
		},
	],
	rules: {
		maxSpinsPerDay: 2,
		maxSpinsPerWeek: 5,
		eligibilityTtlHours: 24,
		trigger: "after_staff_scan",
	},
});

class InMemoryTenantGameActivationRepository extends TenantGameActivationRepository {
	private row: TenantGameActivation | null = null;

	async searchByTenantAndSlug(
		tenantIdValue: string,
		gameSlug: string,
	): Promise<TenantGameActivation | null> {
		if (!this.row || this.row.tenantId !== tenantIdValue || this.row.gameSlug !== gameSlug) {
			return null;
		}

		return this.row;
	}

	async save(activation: TenantGameActivation): Promise<void> {
		this.row = activation;
	}

	setRow(row: TenantGameActivation): void {
		this.row = row;
	}
}

class InMemoryRouletteSpinEligibilityRepository extends RouletteSpinEligibilityRepository {
	rows: RouletteSpinEligibility[] = [];

	async save(eligibility: RouletteSpinEligibility): Promise<void> {
		const id = eligibility.toPrimitives().id;
		this.rows = this.rows.filter((row) => row.toPrimitives().id !== id);
		this.rows.push(eligibility);
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
		return (
			this.rows.find((row) => {
				const primitives = row.toPrimitives();

				return (
					primitives.tenantId === tenantIdValue &&
					primitives.customerId === customerIdValue &&
					primitives.consumedAt === null
				);
			}) ?? null
		);
	}
}

class InMemoryRouletteSpinRepository extends RouletteSpinRepository {
	async save(): Promise<void> {}

	async searchById(): Promise<null> {
		return null;
	}

	async countByCustomerSince(): Promise<number> {
		return 0;
	}
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

class NoopRouletteSpinUnitOfWork extends RouletteSpinUnitOfWork {
	async execute(): Promise<void> {}
}

function buildIssueStack(
	activationRepository: InMemoryTenantGameActivationRepository,
	eligibilityRepository: InMemoryRouletteSpinEligibilityRepository,
	features: SubscriptionPlanFeatures,
	platformGame: PlatformGame,
) {
	const assertFeature = new StubAssertTenantPlanFeature(features) as never;
	const getConfig = new GetTenantRouletteConfig(activationRepository);

	return new IssueRouletteSpinEligibility(
		assertFeature,
		new StubPlatformGameRepository(platformGame),
		getConfig,
		eligibilityRepository,
	);
}

async function main(): Promise<void> {
	const activationRepository = new InMemoryTenantGameActivationRepository();
	const eligibilityRepository = new InMemoryRouletteSpinEligibilityRepository();
	const activeGame = PlatformGame.fromPrimitives({
		id: gameId,
		slug: RULETA_GAME_SLUG,
		label: "Ruleta",
		description: "",
		status: "active",
		requiredFeature: "gamification",
		sortOrder: 1,
	});

	activationRepository.setRow(
		TenantGameActivation.create({
			tenantId,
			gameSlug: RULETA_GAME_SLUG,
			isEnabled: true,
			config: scanTriggerConfig,
		}),
	);

	const issue = buildIssueStack(
		activationRepository,
		eligibilityRepository,
		PREMIUM_PLAN_FEATURES,
		activeGame,
	);

	const granted = await issue.execute({ tenantId, customerId, triggerRef: "scan-1" });

	if (!granted?.eligibilityId || !granted.expiresAt) {
		console.error("❌ IssueRouletteSpinEligibility should grant", granted);
		process.exit(1);
	}

	console.log("✅ IssueRouletteSpinEligibility grants after_staff_scan");

	const active = await eligibilityRepository.findActiveByCustomer(tenantId, customerId);

	if (!active || active.toPrimitives().id !== granted.eligibilityId) {
		console.error("❌ active eligibility not persisted", active?.toPrimitives());
		process.exit(1);
	}

	const renewed = await issue.execute({ tenantId, customerId, triggerRef: "scan-2" });

	if (!renewed || renewed.eligibilityId !== granted.eligibilityId) {
		console.error("❌ repeat scan should renew same eligibility row", renewed);
		process.exit(1);
	}

	if (new Date(renewed.expiresAt).getTime() <= new Date(granted.expiresAt).getTime()) {
		console.error("❌ renewed expiry should be later", granted, renewed);
		process.exit(1);
	}

	console.log("✅ repeat scan renews unconsumed eligibility");

	const basicIssue = buildIssueStack(
		activationRepository,
		new InMemoryRouletteSpinEligibilityRepository(),
		BASIC_PLAN_FEATURES,
		activeGame,
	);
	const basicResult = await basicIssue.execute({ tenantId, customerId });

	if (basicResult !== null) {
		console.error("❌ basic plan should not grant eligibility", basicResult);
		process.exit(1);
	}

	console.log("✅ basic plan no-op");

	const assertFeature = new StubAssertTenantPlanFeature(PREMIUM_PLAN_FEATURES) as never;
	const getConfig = new GetTenantRouletteConfig(activationRepository);
	const spinRepository = new InMemoryRouletteSpinRepository();
	const assertAccess = new AssertRouletteSpinAccess(
		assertFeature,
		new StubPlatformGameRepository(activeGame),
		getConfig,
		spinRepository,
	);
	const publicState = new GetRoulettePublicState(assertAccess, getConfig, eligibilityRepository);
	const locked = await publicState.execute({ tenantId, customerId: "other-customer" });

	if (locked.canSpin || locked.eligibility !== null) {
		console.error("❌ other customer should not inherit eligibility", locked);
		process.exit(1);
	}

	const unlocked = await publicState.execute({ tenantId, customerId });

	if (!unlocked.canSpin || !unlocked.eligibility?.expiresAt) {
		console.error("❌ public state should unlock with active eligibility", unlocked);
		process.exit(1);
	}

	console.log("✅ GetRoulettePublicState requires active eligibility");

	eligibilityRepository.rows = eligibilityRepository.rows.map((row) =>
		row.consume("spin-consumed-test"),
	);

	const executeSpin = new ExecuteRouletteSpin(
		assertAccess,
		getConfig,
		activationRepository,
		eligibilityRepository,
		new NoopRouletteSpinUnitOfWork(),
	);

	try {
		await executeSpin.execute({ tenantId, customerId, userId });
		console.error("❌ consumed eligibility should block spin");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof RouletteSpinNotEligible)) {
			console.error("❌ wrong error after consume", error);
			process.exit(1);
		}
	}

	console.log("✅ ExecuteRouletteSpin requires unconsumed eligibility");

	const expiredRow = RouletteSpinEligibility.create({
		tenantId,
		customerId: "expired-customer",
		expiresAt: new Date(Date.now() - 60_000),
	});
	await eligibilityRepository.save(expiredRow);
	const expiredActive = await eligibilityRepository.findActiveByCustomer(
		tenantId,
		"expired-customer",
	);

	if (expiredActive !== null) {
		console.error("❌ expired eligibility should not be active", expiredActive.toPrimitives());
		process.exit(1);
	}

	console.log("✅ expired eligibility ignored");
	console.log("✅ verify:roulette-scan-eligibility-use-case passed");
}

void main();
