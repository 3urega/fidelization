/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { PlanFeatureNotAvailable } from "../src/contexts/billing/subscriptions/domain/PlanFeatureNotAvailable";
import {
	PREMIUM_PLAN_FEATURES,
	type SubscriptionPlanFeatures,
} from "../src/contexts/billing/subscriptions/domain/SubscriptionPlanFeatures";
import { SubscriptionPlan } from "../src/contexts/billing/subscriptions/domain/SubscriptionPlan";
import { GetTenantRouletteConfig } from "../src/contexts/loyalty/games/application/config/GetTenantRouletteConfig";
import { AuthorizeRouletteSpin } from "../src/contexts/loyalty/games/application/participation/AuthorizeRouletteSpin";
import { EnrollCustomerInRoulette } from "../src/contexts/loyalty/games/application/participation/EnrollCustomerInRoulette";
import { GetRouletteParticipationState } from "../src/contexts/loyalty/games/application/participation/GetRouletteParticipationState";
import { ResolveRouletteParticipationUsage } from "../src/contexts/loyalty/games/application/participation/ResolveRouletteParticipationUsage";
import { AssertRouletteSpinAccess } from "../src/contexts/loyalty/games/application/spin/AssertRouletteSpinAccess";
import { GetRoulettePublicState } from "../src/contexts/loyalty/games/application/spin/GetRoulettePublicState";
import { ListRecentRouletteSpinsForCustomer } from "../src/contexts/loyalty/games/application/spin/ListRecentRouletteSpinsForCustomer";
import {
	createDefaultRouletteConfigV2,
	getParticipationRules,
	parseRouletteConfig,
} from "../src/contexts/loyalty/games/domain/RouletteConfig";
import { RouletteParticipation } from "../src/contexts/loyalty/games/domain/RouletteParticipation";
import { RouletteParticipationRepository } from "../src/contexts/loyalty/games/domain/RouletteParticipationRepository";
import { RouletteSpin } from "../src/contexts/loyalty/games/domain/RouletteSpin";
import { RouletteSpinEligibility } from "../src/contexts/loyalty/games/domain/RouletteSpinEligibility";
import { RouletteSpinEligibilityRepository } from "../src/contexts/loyalty/games/domain/RouletteSpinEligibilityRepository";
import { RouletteSpinRepository } from "../src/contexts/loyalty/games/domain/RouletteSpinRepository";
import {
	RULETA_GAME_SLUG,
	TenantGameActivation,
} from "../src/contexts/loyalty/games/domain/TenantGameActivation";
import { TenantGameActivationRepository } from "../src/contexts/loyalty/games/domain/TenantGameActivationRepository";
import { PlatformGame } from "../src/contexts/platform/domain/PlatformGame";
import { PlatformGameRepository } from "../src/contexts/platform/domain/PlatformGameRepository";

const tenantId = "00000000-0000-4000-8000-0000000000c1";
const customerId = "00000000-0000-4000-8000-0000000000c2";
const gameId = "00000000-0000-4000-8000-000000000030";

const v2Config = createDefaultRouletteConfigV2();
const rules = getParticipationRules(v2Config);

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

class InMemoryRouletteParticipationRepository extends RouletteParticipationRepository {
	rows: RouletteParticipation[] = [];

	async save(participation: RouletteParticipation): Promise<void> {
		const primitives = participation.toPrimitives();
		this.rows = this.rows.filter(
			(row) =>
				!(
					row.toPrimitives().tenantId === primitives.tenantId &&
					row.toPrimitives().customerId === primitives.customerId
				),
		);
		this.rows.push(participation);
	}

	async findByTenantAndCustomer(
		tenantIdValue: string,
		customerIdValue: string,
	): Promise<RouletteParticipation | null> {
		return (
			this.rows.find((row) => {
				const primitives = row.toPrimitives();

				return (
					primitives.tenantId === tenantIdValue && primitives.customerId === customerIdValue
				);
			}) ?? null
		);
	}
}

class InMemoryRouletteSpinRepository extends RouletteSpinRepository {
	spins: RouletteSpin[] = [];

	async save(spin: RouletteSpin): Promise<void> {
		const id = spin.toPrimitives().id;
		this.spins = this.spins.filter((row) => row.toPrimitives().id !== id);
		this.spins.push(spin);
	}

	async searchById(): Promise<null> {
		return null;
	}

	async countByCustomerSince(
		tenantIdValue: string,
		customerIdValue: string,
		since: Date,
	): Promise<number> {
		return this.countByCustomerBetween(tenantIdValue, customerIdValue, since, new Date("9999-01-01"));
	}

	async countByCustomerBetween(
		tenantIdValue: string,
		customerIdValue: string,
		start: Date,
		end: Date,
	): Promise<number> {
		return this.spins.filter((spin) => {
			const primitives = spin.toPrimitives();
			const createdAt = new Date(primitives.createdAt);

			return (
				primitives.tenantId === tenantIdValue &&
				primitives.customerId === customerIdValue &&
				createdAt >= start &&
				createdAt < end
			);
		}).length;
	}

	async listPendingRedeemByCustomer(): Promise<RouletteSpin[]> {
		return [];
	}

	async listRecentByCustomer(
		tenantIdValue: string,
		customerIdValue: string,
		limit: number,
	): Promise<RouletteSpin[]> {
		return this.spins
			.filter((spin) => {
				const primitives = spin.toPrimitives();

				return (
					primitives.tenantId === tenantIdValue && primitives.customerId === customerIdValue
				);
			})
			.sort(
				(a, b) =>
					new Date(b.toPrimitives().createdAt).getTime() -
					new Date(a.toPrimitives().createdAt).getTime(),
			)
			.slice(0, limit);
	}

	seedSpin(spin: RouletteSpin): void {
		this.spins.push(spin);
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

	async countUnconsumedCreatedBetween(
		tenantIdValue: string,
		customerIdValue: string,
		start: Date,
		end: Date,
	): Promise<number> {
		return this.rows.filter((row) => {
			const primitives = row.toPrimitives();
			const createdAt = new Date(primitives.createdAt);

			return (
				primitives.tenantId === tenantIdValue &&
				primitives.customerId === customerIdValue &&
				primitives.consumedAt === null &&
				createdAt >= start &&
				createdAt < end
			);
		}).length;
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

function buildPublicStateStack(
	activationRepository: InMemoryTenantGameActivationRepository,
	participationRepository: InMemoryRouletteParticipationRepository,
	spinRepository: InMemoryRouletteSpinRepository,
	eligibilityRepository: InMemoryRouletteSpinEligibilityRepository,
) {
	const assertFeature = new StubAssertTenantPlanFeature(PREMIUM_PLAN_FEATURES) as never;
	const platformGameRepository = new StubPlatformGameRepository(
		PlatformGame.fromPrimitives({
			id: gameId,
			slug: RULETA_GAME_SLUG,
			label: "Ruleta",
			description: "",
			status: "active",
			requiredFeature: "gamification",
			sortOrder: 1,
		}),
	);
	const getConfig = new GetTenantRouletteConfig(activationRepository);
	const resolveUsage = new ResolveRouletteParticipationUsage(spinRepository, eligibilityRepository);
	const assertAccess = new AssertRouletteSpinAccess(
		assertFeature,
		platformGameRepository,
		getConfig,
		spinRepository,
	);
	const getParticipationState = new GetRouletteParticipationState(
		getConfig,
		participationRepository,
		eligibilityRepository,
		resolveUsage,
	);
	const listRecentSpins = new ListRecentRouletteSpinsForCustomer(spinRepository);

	return {
		publicState: new GetRoulettePublicState(
			assertAccess,
			getConfig,
			getParticipationState,
			listRecentSpins,
			eligibilityRepository,
		),
		enroll: new EnrollCustomerInRoulette(
			assertFeature,
			platformGameRepository,
			getConfig,
			participationRepository,
		),
		authorize: new AuthorizeRouletteSpin(
			assertFeature,
			platformGameRepository,
			getConfig,
			participationRepository,
			eligibilityRepository,
			resolveUsage,
		),
		getConfig,
	};
}

async function main(): Promise<void> {
	const activationRepository = new InMemoryTenantGameActivationRepository();
	const participationRepository = new InMemoryRouletteParticipationRepository();
	const spinRepository = new InMemoryRouletteSpinRepository();
	const eligibilityRepository = new InMemoryRouletteSpinEligibilityRepository();

	activationRepository.setRow(
		TenantGameActivation.create({
			tenantId,
			gameSlug: RULETA_GAME_SLUG,
			isEnabled: true,
			config: v2Config,
		}),
	);

	const stack = buildPublicStateStack(
		activationRepository,
		participationRepository,
		spinRepository,
		eligibilityRepository,
	);

	const beforeEnroll = await stack.publicState.execute({ tenantId, customerId });

	if (
		beforeEnroll.authorizationMode !== "staff_explicit" ||
		beforeEnroll.participationStatus !== "not_enrolled" ||
		beforeEnroll.canSpin ||
		beforeEnroll.blockReason !== "not_enrolled" ||
		beforeEnroll.segments.length === 0
	) {
		console.error("❌ public state before enroll", beforeEnroll);
		process.exit(1);
	}

	console.log("✅ GetRoulettePublicState not_enrolled with segments");

	await stack.enroll.execute({ tenantId, customerId });
	const afterEnroll = await stack.publicState.execute({ tenantId, customerId });

	if (
		afterEnroll.participationStatus !== "active" ||
		afterEnroll.canSpin ||
		afterEnroll.blockReason !== "awaiting_staff_authorization" ||
		afterEnroll.conditionsLabel !== "Mín. 10€ en caja" ||
		afterEnroll.spinsRemainingInPeriod !== rules.maxSpinsInPeriod
	) {
		console.error("❌ public state after enroll", afterEnroll);
		process.exit(1);
	}

	console.log("✅ GetRoulettePublicState active after enroll (no spin yet)");

	const secondEnroll = await stack.enroll.execute({ tenantId, customerId });

	if (secondEnroll.status !== "active") {
		console.error("❌ enroll should be idempotent", secondEnroll);
		process.exit(1);
	}

	console.log("✅ EnrollCustomerInRoulette idempotent in active period");

	await stack.authorize.execute({
		tenantId,
		customerId,
		purchaseAmountEuros: 15,
		triggerRef: "verify-client-auth",
	});

	const afterAuth = await stack.publicState.execute({ tenantId, customerId });

	if (
		afterAuth.participationStatus !== "authorized_ready" ||
		!afterAuth.canSpin ||
		afterAuth.blockReason !== null ||
		!afterAuth.eligibility?.expiresAt
	) {
		console.error("❌ public state after staff authorization", afterAuth);
		process.exit(1);
	}

	console.log("✅ GetRoulettePublicState authorized_ready with canSpin");

	spinRepository.seedSpin(
		RouletteSpin.create({
			tenantId,
			customerId,
			segmentId: v2Config.toPrimitives().segments[0]!.id,
			segmentIndex: 0,
			prizeType: "points",
			prizePayload: { points: 10 },
			triggerSource: "staff_scan",
			triggerRef: "verify-spin-1",
			configSnapshot: v2Config.toPrimitives(),
		}),
	);

	const withHistory = await stack.publicState.execute({ tenantId, customerId });

	if (withHistory.recentSpins.length !== 1 || !withHistory.recentSpins[0]?.segmentLabel) {
		console.error("❌ recentSpins should list last spin", withHistory.recentSpins);
		process.exit(1);
	}

	console.log("✅ ListRecentRouletteSpinsForCustomer in public state");

	const customConfig = parseRouletteConfig({
		...v2Config.toPrimitives(),
		rules: {
			...rules,
			participationConditionsText: "Compra un menú del día",
			minPurchaseEuros: null,
		},
	});

	activationRepository.setRow(
		TenantGameActivation.create({
			tenantId,
			gameSlug: RULETA_GAME_SLUG,
			isEnabled: true,
			config: customConfig,
		}),
	);

	participationRepository.rows = [];
	eligibilityRepository.rows = [];
	await stack.enroll.execute({ tenantId, customerId });
	const customLabel = await stack.publicState.execute({ tenantId, customerId });

	if (customLabel.conditionsLabel !== "Compra un menú del día") {
		console.error("❌ conditionsLabel should prefer owner text", customLabel.conditionsLabel);
		process.exit(1);
	}

	console.log("✅ buildConditionsLabel prefers participationConditionsText");

	console.log("\n✅ verify:roulette-client-participation-use-case passed");
}

void main();
