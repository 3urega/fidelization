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
import {
	createDefaultRouletteConfigV2,
	getParticipationRules,
	parseRouletteConfig,
} from "../src/contexts/loyalty/games/domain/RouletteConfig";
import { RouletteMinPurchaseNotMet } from "../src/contexts/loyalty/games/domain/RouletteMinPurchaseNotMet";
import { RouletteNotEnrolled } from "../src/contexts/loyalty/games/domain/RouletteNotEnrolled";
import { RouletteParticipation } from "../src/contexts/loyalty/games/domain/RouletteParticipation";
import { RouletteParticipationRepository } from "../src/contexts/loyalty/games/domain/RouletteParticipationRepository";
import { RoulettePendingAuthorization } from "../src/contexts/loyalty/games/domain/RoulettePendingAuthorization";
import { RouletteQuotaExhausted } from "../src/contexts/loyalty/games/domain/RouletteQuotaExhausted";
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

const tenantId = "00000000-0000-4000-8000-0000000000x1";
const customerId = "00000000-0000-4000-8000-0000000000x2";
const gameId = "00000000-0000-4000-8000-000000000030";

const v2Config = createDefaultRouletteConfigV2();

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

function buildStack(
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

	return {
		enroll: new EnrollCustomerInRoulette(
			assertFeature,
			platformGameRepository,
			getConfig,
			participationRepository,
		),
		state: new GetRouletteParticipationState(
			getConfig,
			participationRepository,
			eligibilityRepository,
			resolveUsage,
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

async function expectError<T>(
	label: string,
	action: () => Promise<unknown>,
	errorType: new (...args: never[]) => T,
): Promise<void> {
	try {
		await action();
		console.error(`❌ ${label}: expected ${errorType.name}`);
		process.exit(1);
	} catch (error) {
		if (!(error instanceof errorType)) {
			console.error(`❌ ${label}: wrong error`, error);
			process.exit(1);
		}
	}

	console.log(`✅ ${label}`);
}

async function main(): Promise<void> {
	const parsedV2 = parseRouletteConfig(v2Config.toPrimitives());
	const rules = getParticipationRules(parsedV2);

	if (parsedV2.toPrimitives().version !== 2 || rules.authorizationMode !== "staff_explicit") {
		console.error("❌ v2 config parse", parsedV2.toPrimitives());
		process.exit(1);
	}

	console.log("✅ parseRouletteConfig v2");

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

	const { enroll, state, authorize } = buildStack(
		activationRepository,
		participationRepository,
		spinRepository,
		eligibilityRepository,
	);

	const notEnrolled = await state.execute({ tenantId, customerId });

	if (notEnrolled.status !== "not_enrolled") {
		console.error("❌ initial state should be not_enrolled", notEnrolled);
		process.exit(1);
	}

	console.log("✅ GetRouletteParticipationState not_enrolled");

	await expectError(
		"AuthorizeRouletteSpin without enrollment",
		() => authorize.execute({ tenantId, customerId, purchaseAmountEuros: 15 }),
		RouletteNotEnrolled,
	);

	const enrolled = await enroll.execute({ tenantId, customerId });
	const enrolledAt = new Date(enrolled.enrolledAt);
	const periodEndsAt = new Date(enrolled.periodEndsAt);
	const expectedPeriodMs = rules.participationPeriodDays * 24 * 60 * 60 * 1000;

	if (
		!enrolled.participationId ||
		Math.abs(periodEndsAt.getTime() - enrolledAt.getTime() - expectedPeriodMs) > 1000
	) {
		console.error("❌ EnrollCustomerInRoulette periodEndsAt", enrolled);
		process.exit(1);
	}

	console.log("✅ EnrollCustomerInRoulette creates participation period");

	const activeState = await state.execute({ tenantId, customerId });

	if (
		activeState.status !== "active" ||
		activeState.spinsRemainingInPeriod !== rules.maxSpinsInPeriod ||
		activeState.spinsRemainingToday !== rules.maxSpinsPerDay
	) {
		console.error("❌ active participation state", activeState);
		process.exit(1);
	}

	console.log("✅ GetRouletteParticipationState active with full quota");

	await expectError(
		"AuthorizeRouletteSpin below min purchase",
		() => authorize.execute({ tenantId, customerId, purchaseAmountEuros: 8 }),
		RouletteMinPurchaseNotMet,
	);

	const authorized = await authorize.execute({
		tenantId,
		customerId,
		purchaseAmountEuros: 15,
		triggerRef: "scan-auth-1",
	});

	if (!authorized.eligibilityId || !authorized.expiresAt) {
		console.error("❌ AuthorizeRouletteSpin should grant eligibility", authorized);
		process.exit(1);
	}

	const savedEligibility = await eligibilityRepository.findActiveByCustomer(tenantId, customerId);

	if (
		!savedEligibility ||
		savedEligibility.toPrimitives().authorizedPurchaseEuros !== 15
	) {
		console.error("❌ eligibility should store purchase amount", savedEligibility?.toPrimitives());
		process.exit(1);
	}

	console.log("✅ AuthorizeRouletteSpin persists consumable eligibility");

	const afterAuth = await state.execute({ tenantId, customerId });

	if (
		!afterAuth.pendingAuthorization ||
		afterAuth.spinsRemainingInPeriod !== rules.maxSpinsInPeriod - 1
	) {
		console.error("❌ state after authorization", afterAuth);
		process.exit(1);
	}

	console.log("✅ GetRouletteParticipationState reflects reserved quota");

	await expectError(
		"AuthorizeRouletteSpin blocks pending authorization",
		() => authorize.execute({ tenantId, customerId, purchaseAmountEuros: 20 }),
		RoulettePendingAuthorization,
	);

	const periodLimitedConfig = parseRouletteConfig({
		...v2Config.toPrimitives(),
		rules: {
			...rules,
			maxSpinsInPeriod: 1,
			maxSpinsPerDay: 1,
		},
	});

	activationRepository.setRow(
		TenantGameActivation.create({
			tenantId,
			gameSlug: RULETA_GAME_SLUG,
			isEnabled: true,
			config: periodLimitedConfig,
		}),
	);

	participationRepository.rows = [];
	eligibilityRepository.rows = [];
	spinRepository.spins = [];
	await enroll.execute({ tenantId, customerId });
	await authorize.execute({ tenantId, customerId, purchaseAmountEuros: 15 });
	await eligibilityRepository.save(eligibilityRepository.rows[0]!.consume("spin-period-1"));
	spinRepository.seedSpin(
		RouletteSpin.create({
			tenantId,
			customerId,
			segmentId: "00000000-0000-4000-8000-000000000e01",
			segmentIndex: 0,
			prizeType: "none",
			prizePayload: {},
			triggerSource: "staff_scan",
			triggerRef: "spin-period-1",
			configSnapshot: periodLimitedConfig.toPrimitives(),
		}),
	);

	await expectError(
		"AuthorizeRouletteSpin period quota exhausted",
		() => authorize.execute({ tenantId, customerId, purchaseAmountEuros: 20 }),
		RouletteQuotaExhausted,
	);

	console.log("✅ AuthorizeRouletteSpin enforces period quota");

	eligibilityRepository.rows = [];
	spinRepository.spins = [];
	participationRepository.rows = [];

	const dailyConfig = parseRouletteConfig({
		...v2Config.toPrimitives(),
		rules: {
			...rules,
			maxSpinsInPeriod: 5,
			maxSpinsPerDay: 1,
		},
	});

	activationRepository.setRow(
		TenantGameActivation.create({
			tenantId,
			gameSlug: RULETA_GAME_SLUG,
			isEnabled: true,
			config: dailyConfig,
		}),
	);

	await enroll.execute({ tenantId, customerId });
	await authorize.execute({ tenantId, customerId, purchaseAmountEuros: 12 });
	await eligibilityRepository.save(eligibilityRepository.rows[0]!.consume("spin-daily-1"));
	spinRepository.seedSpin(
		RouletteSpin.create({
			tenantId,
			customerId,
			segmentId: "00000000-0000-4000-8000-000000000e01",
			segmentIndex: 0,
			prizeType: "none",
			prizePayload: {},
			triggerSource: "staff_scan",
			triggerRef: "spin-daily-1",
			configSnapshot: dailyConfig.toPrimitives(),
		}),
	);

	await expectError(
		"AuthorizeRouletteSpin daily quota exhausted",
		() => authorize.execute({ tenantId, customerId, purchaseAmountEuros: 12 }),
		RouletteQuotaExhausted,
	);

	console.log("✅ AuthorizeRouletteSpin enforces daily quota");
	console.log("✅ verify:roulette-participation-use-case passed");
}

void main();
