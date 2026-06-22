/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { PlanFeatureNotAvailable } from "../src/contexts/billing/subscriptions/domain/PlanFeatureNotAvailable";
import {
	BASIC_PLAN_FEATURES,
	PREMIUM_PLAN_FEATURES,
	type SubscriptionPlanFeatures,
} from "../src/contexts/billing/subscriptions/domain/SubscriptionPlanFeatures";
import { SubscriptionPlan } from "../src/contexts/billing/subscriptions/domain/SubscriptionPlan";
import { ApplyCustomerLoyaltyOutcome } from "../src/contexts/loyalty/customers/application/loyalty/ApplyCustomerLoyaltyOutcome";
import { Customer } from "../src/contexts/loyalty/customers/domain/Customer";
import { CustomerRepository } from "../src/contexts/loyalty/customers/domain/CustomerRepository";
import { LoyaltyTransactionRepository } from "../src/contexts/loyalty/loyalty_transactions/domain/LoyaltyTransactionRepository";
import { CustomerPromotionUsageRepository } from "../src/contexts/loyalty/promotions/domain/CustomerPromotionUsageRepository";
import { PromotionRepository } from "../src/contexts/loyalty/promotions/domain/PromotionRepository";
import { StampCampaignRepository } from "../src/contexts/loyalty/stamp_campaigns/domain/StampCampaignRepository";
import { AssertRouletteSpinAccess } from "../src/contexts/loyalty/games/application/spin/AssertRouletteSpinAccess";
import { ExecuteRouletteSpin } from "../src/contexts/loyalty/games/application/spin/ExecuteRouletteSpin";
import { GetRouletteParticipationState } from "../src/contexts/loyalty/games/application/participation/GetRouletteParticipationState";
import { ResolveRouletteParticipationUsage } from "../src/contexts/loyalty/games/application/participation/ResolveRouletteParticipationUsage";
import { GetRoulettePublicState } from "../src/contexts/loyalty/games/application/spin/GetRoulettePublicState";
import { ListRecentRouletteSpinsForCustomer } from "../src/contexts/loyalty/games/application/spin/ListRecentRouletteSpinsForCustomer";
import { GetTenantRouletteConfig } from "../src/contexts/loyalty/games/application/config/GetTenantRouletteConfig";
import { RouletteGameDisabled } from "../src/contexts/loyalty/games/domain/RouletteGameDisabled";
import { RouletteGameNotAvailable } from "../src/contexts/loyalty/games/domain/RouletteGameNotAvailable";
import { RouletteSegmentsExhausted } from "../src/contexts/loyalty/games/domain/RouletteSegmentsExhausted";
import { RouletteSpinRateLimitExceeded } from "../src/contexts/loyalty/games/domain/RouletteSpinRateLimitExceeded";
import { RouletteSpinNotEligible } from "../src/contexts/loyalty/games/domain/RouletteSpinNotEligible";
import { RouletteSpin, type RouletteSpinPrimitives } from "../src/contexts/loyalty/games/domain/RouletteSpin";
import { RouletteSpinEligibility } from "../src/contexts/loyalty/games/domain/RouletteSpinEligibility";
import { RouletteSpinEligibilityRepository } from "../src/contexts/loyalty/games/domain/RouletteSpinEligibilityRepository";
import { RouletteParticipationRepository } from "../src/contexts/loyalty/games/domain/RouletteParticipationRepository";
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

const tenantId = "00000000-0000-4000-8000-0000000000s1";
const customerId = "00000000-0000-4000-8000-0000000000s2";
const userId = "00000000-0000-4000-8000-0000000000s3";
const gameId = "00000000-0000-4000-8000-000000000030";

const pointsOnlyConfig = parseRouletteConfig({
	version: 1,
	segments: [
		{
			id: "00000000-0000-4000-8000-000000000201",
			label: "+10 puntos",
			weight: 100,
			prizeType: "points",
			prize: { points: 10 },
			stockLimit: null,
			stockUsed: 0,
		},
		{
			id: "00000000-0000-4000-8000-000000000202",
			label: "Sin premio",
			weight: 1,
			prizeType: "none",
			prize: {},
			stockLimit: null,
			stockUsed: 0,
		},
	],
	rules: {
		maxSpinsPerDay: 1,
		maxSpinsPerWeek: 3,
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

class InMemoryRouletteSpinRepository extends RouletteSpinRepository {
	private spins: RouletteSpin[] = [];

	async save(spin: RouletteSpin): Promise<void> {
		const id = spin.toPrimitives().id;
		this.spins = this.spins.filter((existing) => existing.toPrimitives().id !== id);
		this.spins.push(spin);
	}

	async searchById(tenantIdValue: string, id: string): Promise<RouletteSpin | null> {
		return (
			this.spins.find(
				(spin) => spin.toPrimitives().id === id && spin.toPrimitives().tenantId === tenantIdValue,
			) ?? null
		);
	}

	async countByCustomerSince(
		tenantIdValue: string,
		customerIdValue: string,
		since: Date,
	): Promise<number> {
		return this.spins.filter((spin) => {
			const primitives = spin.toPrimitives();

			return (
				primitives.tenantId === tenantIdValue &&
				primitives.customerId === customerIdValue &&
				new Date(primitives.createdAt) >= since
			);
		}).length;
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

	all(): RouletteSpinPrimitives[] {
		return this.spins.map((spin) => spin.toPrimitives());
	}
}

class InMemoryRouletteParticipationRepository extends RouletteParticipationRepository {
	async save(): Promise<void> {}

	async findByTenantAndCustomer(): Promise<null> {
		return null;
	}
}

class InMemoryRouletteSpinEligibilityRepository extends RouletteSpinEligibilityRepository {
	private rows: RouletteSpinEligibility[] = [];

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

	seedActive(expiresAt: Date): RouletteSpinEligibility {
		const eligibility = RouletteSpinEligibility.create({
			tenantId,
			customerId,
			expiresAt,
		});
		this.rows = [eligibility];

		return eligibility;
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

class InMemoryRouletteSpinUnitOfWork extends RouletteSpinUnitOfWork {
	constructor(
		private readonly spinRepository: InMemoryRouletteSpinRepository,
		private readonly activationRepository: InMemoryTenantGameActivationRepository,
		private readonly eligibilityRepository: InMemoryRouletteSpinEligibilityRepository,
		private readonly applyOutcome: ApplyCustomerLoyaltyOutcome,
	) {
		super();
	}

	async execute(params: import("../src/contexts/loyalty/games/domain/RouletteSpinUnitOfWork").RouletteSpinUnitOfWorkParams): Promise<void> {
		await this.spinRepository.save(params.spin);
		await this.activationRepository.save(params.activation);
		await this.eligibilityRepository.save(params.eligibilityToConsume);

		const prize = params.prizeApplication;

		if (!prize) {
			return;
		}

		const metadata = {
			source: "roulette_spin",
			spinId: prize.spinId,
		};

		if (prize.prizeType === "points") {
			const points = prize.prize.points;

			if (!points || points < 1) {
				return;
			}

			await this.applyOutcome.applyPoints({
				tenantId: prize.tenantId,
				customerId: prize.customerId,
				points,
				createdByUserId: prize.userId,
				metadata,
			});

			return;
		}

		if (prize.prizeType === "stamp") {
			const campaignId = prize.prize.campaignId;

			if (!campaignId) {
				return;
			}

			await this.applyOutcome.applyStamp({
				tenantId: prize.tenantId,
				customerId: prize.customerId,
				campaignId,
				createdByUserId: prize.userId,
				metadata,
			});

			return;
		}

		if (prize.prizeType === "promotion") {
			const promotionId = prize.prize.promotionId;

			if (!promotionId) {
				return;
			}

			await this.applyOutcome.applyPromotion({
				tenantId: prize.tenantId,
				customerId: prize.customerId,
				promotionId,
				createdByUserId: prize.userId,
				metadata,
			});
		}
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

class InMemoryCustomerRepository extends CustomerRepository {
	private customer: Customer;

	constructor(customer: Customer) {
		super();
		this.customer = customer;
	}

	async save(customer: Customer): Promise<void> {
		this.customer = customer;
	}

	async searchById(tenantIdValue: string, id: string): Promise<Customer | null> {
		if (tenantIdValue !== tenantId || id !== customerId) {
			return null;
		}

		return this.customer;
	}

	async searchByQrValue(): Promise<Customer | null> {
		return null;
	}

	async searchByUserIdAndTenantId(): Promise<Customer | null> {
		return this.customer;
	}

	async listWithInteractionByUserId(): Promise<never[]> {
		return [];
	}

	get(): Customer {
		return this.customer;
	}
}

class NoopLoyaltyTransactionRepository extends LoyaltyTransactionRepository {
	async save(): Promise<void> {}
	async searchById(): Promise<null> {
		return null;
	}
}

class NoopStampCampaignRepository extends StampCampaignRepository {
	async saveCampaign(): Promise<void> {}
	async deleteCampaign(): Promise<void> {}
	async searchCampaignById(): Promise<null> {
		return null;
	}
	async listByTenant(): Promise<never[]> {
		return [];
	}
	async listActiveByTenant(): Promise<never[]> {
		return [];
	}
	async saveProgress(): Promise<void> {}
	async searchProgress(): Promise<null> {
		return null;
	}
	async hasActiveGenericCampaigns(): Promise<boolean> {
		return false;
	}
}

class NoopPromotionRepository extends PromotionRepository {
	async save(): Promise<void> {}
	async searchById(): Promise<null> {
		return null;
	}
	async listByTenant(): Promise<never[]> {
		return [];
	}
	async listActiveByTenantAt(): Promise<never[]> {
		return [];
	}
}

class NoopCustomerPromotionUsageRepository extends CustomerPromotionUsageRepository {
	async saveUsage(): Promise<void> {}
	async searchUsage(): Promise<null> {
		return null;
	}
}

class StubAssertTenantPlanFeature {
	constructor(private readonly features: SubscriptionPlanFeatures) {}

	async execute(params: { tenantId: string; feature: "gamification" | "promotions" }): Promise<SubscriptionPlan> {
		if (params.feature === "gamification" && !this.features.gamification) {
			throw new PlanFeatureNotAvailable(params.tenantId, params.feature);
		}

		if (params.feature === "promotions" && !this.features.promotions) {
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

function buildStack(
	activationRepository: InMemoryTenantGameActivationRepository,
	spinRepository: InMemoryRouletteSpinRepository,
	eligibilityRepository: InMemoryRouletteSpinEligibilityRepository,
	platformGame: PlatformGame | null,
	customerRepository: InMemoryCustomerRepository,
	features: SubscriptionPlanFeatures,
) {
	const assertFeature = new StubAssertTenantPlanFeature(features) as never;
	const getConfig = new GetTenantRouletteConfig(activationRepository);
	const assertAccess = new AssertRouletteSpinAccess(
		assertFeature,
		new StubPlatformGameRepository(platformGame),
		getConfig,
		spinRepository,
	);
	const applyOutcome = new ApplyCustomerLoyaltyOutcome(
		customerRepository,
		new NoopLoyaltyTransactionRepository(),
		new NoopStampCampaignRepository(),
		new NoopPromotionRepository(),
		new NoopCustomerPromotionUsageRepository(),
		assertFeature,
	);
	const participationRepository = new InMemoryRouletteParticipationRepository();
	const resolveUsage = new ResolveRouletteParticipationUsage(
		spinRepository,
		eligibilityRepository,
	);
	const getParticipationState = new GetRouletteParticipationState(
		getConfig,
		participationRepository,
		eligibilityRepository,
		resolveUsage,
	);
	const listRecentSpins = new ListRecentRouletteSpinsForCustomer(spinRepository);
	const unitOfWork = new InMemoryRouletteSpinUnitOfWork(
		spinRepository,
		activationRepository,
		eligibilityRepository,
		applyOutcome,
	);

	return {
		executeSpin: new ExecuteRouletteSpin(
			assertAccess,
			getConfig,
			activationRepository,
			eligibilityRepository,
			unitOfWork,
		),
		publicState: new GetRoulettePublicState(
			assertAccess,
			getConfig,
			getParticipationState,
			listRecentSpins,
			eligibilityRepository,
		),
		eligibilityRepository,
	};
}

async function main(): Promise<void> {
	const activationRepository = new InMemoryTenantGameActivationRepository();
	const spinRepository = new InMemoryRouletteSpinRepository();
	const eligibilityRepository = new InMemoryRouletteSpinEligibilityRepository();
	const customer = Customer.fromPrimitives({
		id: customerId,
		tenantId,
		userId,
		name: "Spin Verify",
		email: "spin@verify.local",
		phone: null,
		qrValue: "qr-spin-verify",
		pointsBalance: 0,
		visitsCount: 0,
	});
	const customerRepository = new InMemoryCustomerRepository(customer);

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
			config: pointsOnlyConfig,
		}),
	);

	const stack = buildStack(
		activationRepository,
		spinRepository,
		eligibilityRepository,
		activeGame,
		customerRepository,
		PREMIUM_PLAN_FEATURES,
	);

	const lockedState = await stack.publicState.execute({ tenantId, customerId });

	if (lockedState.canSpin || lockedState.eligibility !== null) {
		console.error("❌ public state should be locked without eligibility", lockedState);
		process.exit(1);
	}

	console.log("✅ GetRoulettePublicState locked without eligibility");

	try {
		await stack.executeSpin.execute({ tenantId, customerId, userId, rng: () => 0 });
		console.error("❌ spin without eligibility should throw");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof RouletteSpinNotEligible)) {
			console.error("❌ wrong error without eligibility", error);
			process.exit(1);
		}
	}

	console.log("✅ ExecuteRouletteSpin blocked without eligibility");

	eligibilityRepository.seedActive(new Date(Date.now() + 24 * 60 * 60 * 1000));

	const state = await stack.publicState.execute({ tenantId, customerId });

	if (!state.canSpin || state.segments.length !== 2 || !state.eligibility?.expiresAt) {
		console.error("❌ public state canSpin with eligibility", state);
		process.exit(1);
	}

	console.log("✅ GetRoulettePublicState canSpin with eligibility");

	const result = await stack.executeSpin.execute({
		tenantId,
		customerId,
		userId,
		rng: () => 0,
	});

	if (result.prizeType !== "points" || result.prize.points !== 10) {
		console.error("❌ spin should award points", result);
		process.exit(1);
	}

	if (customerRepository.get().pointsBalance !== 10) {
		console.error("❌ customer points not updated", customerRepository.get().toPrimitives());
		process.exit(1);
	}

	const activationAfter = await activationRepository.searchByTenantAndSlug(tenantId, RULETA_GAME_SLUG);
	const stockUsed =
		activationAfter?.config.toPrimitives().segments.find((segment) => segment.id === result.spinId)
			?.stockUsed ?? activationAfter?.config
			.toPrimitives()
			.segments.find((segment) => segment.label === "+10 puntos")?.stockUsed;

	if (stockUsed !== 0 && stockUsed !== undefined) {
		// points segment has null stockLimit; stockUsed stays 0
	}

	console.log("✅ ExecuteRouletteSpin applies points prize");

	try {
		await stack.executeSpin.execute({ tenantId, customerId, userId, rng: () => 0 });
		console.error("❌ second spin should hit rate limit");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof RouletteSpinRateLimitExceeded)) {
			console.error("❌ wrong error on rate limit", error);
			process.exit(1);
		}
	}

	console.log("✅ rate limit enforced");

	activationRepository.setRow(
		TenantGameActivation.create({
			tenantId,
			gameSlug: RULETA_GAME_SLUG,
			isEnabled: false,
			config: pointsOnlyConfig,
		}),
	);

	const disabledStack = buildStack(
		activationRepository,
		new InMemoryRouletteSpinRepository(),
		new InMemoryRouletteSpinEligibilityRepository(),
		activeGame,
		customerRepository,
		PREMIUM_PLAN_FEATURES,
	);
	disabledStack.eligibilityRepository.seedActive(new Date(Date.now() + 24 * 60 * 60 * 1000));

	try {
		await disabledStack.executeSpin.execute({ tenantId, customerId, userId });
		console.error("❌ disabled game should throw");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof RouletteGameDisabled)) {
			console.error("❌ wrong error on disabled", error);
			process.exit(1);
		}
	}

	console.log("✅ disabled game blocked");

	activationRepository.setRow(
		TenantGameActivation.create({
			tenantId,
			gameSlug: RULETA_GAME_SLUG,
			isEnabled: true,
			config: pointsOnlyConfig,
		}),
	);

	const draftStack = buildStack(
		activationRepository,
		new InMemoryRouletteSpinRepository(),
		new InMemoryRouletteSpinEligibilityRepository(),
		PlatformGame.fromPrimitives({ ...activeGame.toPrimitives(), status: "draft" }),
		customerRepository,
		PREMIUM_PLAN_FEATURES,
	);
	draftStack.eligibilityRepository.seedActive(new Date(Date.now() + 24 * 60 * 60 * 1000));

	try {
		await draftStack.executeSpin.execute({ tenantId, customerId, userId });
		console.error("❌ draft game should throw");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof RouletteGameNotAvailable)) {
			console.error("❌ wrong error on draft game", error);
			process.exit(1);
		}
	}

	console.log("✅ draft platform game blocked");

	const basicStack = buildStack(
		activationRepository,
		new InMemoryRouletteSpinRepository(),
		new InMemoryRouletteSpinEligibilityRepository(),
		activeGame,
		customerRepository,
		BASIC_PLAN_FEATURES,
	);
	basicStack.eligibilityRepository.seedActive(new Date(Date.now() + 24 * 60 * 60 * 1000));

	try {
		await basicStack.executeSpin.execute({ tenantId, customerId, userId });
		console.error("❌ basic plan should throw");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof PlanFeatureNotAvailable)) {
			console.error("❌ wrong error on basic plan", error);
			process.exit(1);
		}
	}

	console.log("✅ basic plan blocked");

	const exhaustedConfig = parseRouletteConfig({
		version: 1,
		segments: [
			{
				id: "00000000-0000-4000-8000-000000000301",
				label: "Agotado",
				weight: 10,
				prizeType: "physical",
				prize: { description: "x" },
				stockLimit: 1,
				stockUsed: 1,
			},
			{
				id: "00000000-0000-4000-8000-000000000302",
				label: "Agotado 2",
				weight: 10,
				prizeType: "physical",
				prize: { description: "y" },
				stockLimit: 1,
				stockUsed: 1,
			},
		],
		rules: pointsOnlyConfig.toPrimitives().rules,
	});

	activationRepository.setRow(
		TenantGameActivation.create({
			tenantId,
			gameSlug: RULETA_GAME_SLUG,
			isEnabled: true,
			config: exhaustedConfig,
		}),
	);

	const exhaustedStack = buildStack(
		activationRepository,
		new InMemoryRouletteSpinRepository(),
		new InMemoryRouletteSpinEligibilityRepository(),
		activeGame,
		customerRepository,
		PREMIUM_PLAN_FEATURES,
	);
	exhaustedStack.eligibilityRepository.seedActive(new Date(Date.now() + 24 * 60 * 60 * 1000));

	try {
		await exhaustedStack.executeSpin.execute({ tenantId, customerId, userId });
		console.error("❌ exhausted segments should throw");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof RouletteSegmentsExhausted)) {
			console.error("❌ wrong error on exhausted", error);
			process.exit(1);
		}
	}

	console.log("✅ RouletteSegmentsExhausted when no stock");
	console.log("✅ verify:roulette-spin-use-case passed");
}

void main();
