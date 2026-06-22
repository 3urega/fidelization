/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { PlanFeatureNotAvailable } from "../src/contexts/billing/subscriptions/domain/PlanFeatureNotAvailable";
import {
	PREMIUM_PLAN_FEATURES,
	type SubscriptionPlanFeatures,
} from "../src/contexts/billing/subscriptions/domain/SubscriptionPlanFeatures";
import { SubscriptionPlan } from "../src/contexts/billing/subscriptions/domain/SubscriptionPlan";
import { AssertTenantPlanFeature } from "../src/contexts/billing/subscriptions/application/guard/AssertTenantPlanFeature";
import { ResolveTenantEffectivePlanFeatures } from "../src/contexts/billing/subscriptions/application/resolve/ResolveTenantEffectivePlanFeatures";
import { ResolveTenantSubscriptionPlan } from "../src/contexts/billing/subscriptions/application/resolve/ResolveTenantSubscriptionPlan";
import { User } from "../src/contexts/identity/users/domain/User";
import { UserRepository } from "../src/contexts/identity/users/domain/UserRepository";
import { ApplyCustomerLoyaltyOutcome } from "../src/contexts/loyalty/customers/application/loyalty/ApplyCustomerLoyaltyOutcome";
import { RecordStaffRouletteAuthorizeByQr } from "../src/contexts/loyalty/customers/application/scan/RecordStaffRouletteAuthorizeByQr";
import { RecordStaffScanByTarget } from "../src/contexts/loyalty/customers/application/scan/RecordStaffScanByTarget";
import { ResolveCustomerByQrForStaffScan } from "../src/contexts/loyalty/customers/application/scan/ResolveCustomerByQrForStaffScan";
import { Customer } from "../src/contexts/loyalty/customers/domain/Customer";
import { CustomerRepository } from "../src/contexts/loyalty/customers/domain/CustomerRepository";
import {
	mapRouletteAuthorizeErrorToDeniedOutcome,
	type StaffScanOutcome,
} from "../src/contexts/loyalty/customers/domain/StaffScanOutcome";
import {
	parseStaffScanTargetInput,
	ROULETTE_AUTHORIZE_TARGET_ID,
} from "../src/contexts/loyalty/customers/domain/StaffScanTarget";
import { GetTenantRouletteConfig } from "../src/contexts/loyalty/games/application/config/GetTenantRouletteConfig";
import { AuthorizeRouletteSpin } from "../src/contexts/loyalty/games/application/participation/AuthorizeRouletteSpin";
import { EnrollCustomerInRoulette } from "../src/contexts/loyalty/games/application/participation/EnrollCustomerInRoulette";
import { ResolveRouletteParticipationUsage } from "../src/contexts/loyalty/games/application/participation/ResolveRouletteParticipationUsage";
import {
	createDefaultRouletteConfigV2,
	getParticipationRules,
	parseRouletteConfig,
} from "../src/contexts/loyalty/games/domain/RouletteConfig";
import { RouletteMinPurchaseNotMet } from "../src/contexts/loyalty/games/domain/RouletteMinPurchaseNotMet";
import { RouletteNotEnrolled } from "../src/contexts/loyalty/games/domain/RouletteNotEnrolled";
import { RouletteParticipation } from "../src/contexts/loyalty/games/domain/RouletteParticipation";
import { RouletteParticipationPeriodExpired } from "../src/contexts/loyalty/games/domain/RouletteParticipationPeriodExpired";
import { RouletteParticipationRepository } from "../src/contexts/loyalty/games/domain/RouletteParticipationRepository";
import { RoulettePendingAuthorization } from "../src/contexts/loyalty/games/domain/RoulettePendingAuthorization";
import { RouletteQuotaExhausted } from "../src/contexts/loyalty/games/domain/RouletteQuotaExhausted";
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
import { TenantRole } from "../src/contexts/tenants/memberships/domain/TenantRole";
import { Tenant } from "../src/contexts/tenants/tenants/domain/Tenant";
import { TenantRepository } from "../src/contexts/tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../src/contexts/tenants/tenants/domain/TenantStatus";

const tenantId = "00000000-0000-4000-8000-000000000121";
const customerId = "00000000-0000-4000-8000-000000000122";
const staffUserId = "00000000-0000-4000-8000-000000000123";
const campaignId = "00000000-0000-4000-8000-000000000124";
const gameId = "00000000-0000-4000-8000-000000000030";
const customerQr = "staff-auth-verify-qr";

const v2Config = createDefaultRouletteConfigV2();

class InMemoryTenantRepository extends TenantRepository {
	async findById(id: string): Promise<Tenant | null> {
		if (id !== tenantId) {
			return null;
		}

		return Tenant.fromPrimitives({
			id: tenantId,
			name: "Staff Auth Cafe",
			slug: "staff-auth-cafe",
			logoUrl: "",
			primaryColor: "#000",
			secondaryColor: "#fff",
			subscriptionPlan: "premium",
			subscriptionPlanId: "plan-premium",
			status: TenantStatus.Active,
			createdAt: new Date().toISOString(),
		});
	}

	async findAll(): Promise<Tenant[]> {
		const tenant = await this.findById(tenantId);

		return tenant ? [tenant] : [];
	}

	async findBySlug(): Promise<Tenant | null> {
		return this.findById(tenantId);
	}

	async save(): Promise<void> {}
}

class InMemoryCustomerRepository extends CustomerRepository {
	private customer = Customer.fromPrimitives({
		id: customerId,
		tenantId,
		name: "Cliente verify",
		email: null,
		phone: null,
		qrValue: customerQr,
		userId: null,
		pointsBalance: 0,
		visitsCount: 0,
		createdAt: new Date().toISOString(),
	});

	async searchByQrValue(tenantIdValue: string, qrValue: string): Promise<Customer | null> {
		if (tenantIdValue !== tenantId || qrValue !== customerQr) {
			return null;
		}

		return this.customer;
	}

	async searchById(tenantIdValue: string, id: string): Promise<Customer | null> {
		if (tenantIdValue !== tenantId || id !== customerId) {
			return null;
		}

		return this.customer;
	}

	async save(customer: Customer): Promise<void> {
		this.customer = customer;
	}

	async searchByUserId(): Promise<Customer | null> {
		return null;
	}

	async saveMany(): Promise<void> {}
}

class InMemoryUserRepository extends UserRepository {
	async searchByQrValue(): Promise<User | null> {
		return null;
	}

	async searchById(): Promise<User | null> {
		return null;
	}

	async save(): Promise<void> {}
}

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
			this.rows.find(
				(row) =>
					row.toPrimitives().tenantId === tenantIdValue &&
					row.toPrimitives().customerId === customerIdValue,
			) ?? null
		);
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
				const p = row.toPrimitives();

				return (
					p.tenantId === tenantIdValue &&
					p.customerId === customerIdValue &&
					p.consumedAt === null
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

class InMemoryRouletteSpinRepository extends RouletteSpinRepository {
	spins: never[] = [];

	async save(): Promise<void> {}

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
		_tenantIdValue: string,
		_customerIdValue: string,
		_start: Date,
		_end: Date,
	): Promise<number> {
		return 0;
	}

	async listPendingRedeemByCustomer(): Promise<[]> {
		return [];
	}

	async listRecentByCustomer(): Promise<[]> {
		return [];
	}
}

class StubPlatformGameRepository extends PlatformGameRepository {
	constructor(private readonly game: PlatformGame) {
		super();
	}

	async searchBySlug(slug: string): Promise<PlatformGame | null> {
		return slug === RULETA_GAME_SLUG ? this.game : null;
	}

	async listAll(): Promise<PlatformGame[]> {
		return [this.game];
	}

	async save(): Promise<void> {}

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

class TrackingIssueRouletteSpinEligibility {
	called = false;

	async execute(): Promise<{ expiresAt: string } | null> {
		this.called = true;

		return null;
	}
}

function assertDenied(
	label: string,
	error: unknown,
	expectedCode: string,
	expectedMessagePart: string,
): void {
	const outcome = mapRouletteAuthorizeErrorToDeniedOutcome(error);

	if (
		outcome.kind !== "roulette_auth_denied" ||
		outcome.reasonCode !== expectedCode ||
		!outcome.message.includes(expectedMessagePart)
	) {
		console.error(`❌ ${label}`, outcome);
		process.exit(1);
	}

	console.log(`✅ ${label}`);
}

function buildAuthorizeStack(
	activationRepository: InMemoryTenantGameActivationRepository,
	participationRepository: InMemoryRouletteParticipationRepository,
	eligibilityRepository: InMemoryRouletteSpinEligibilityRepository,
	spinRepository: InMemoryRouletteSpinRepository,
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
	const parsedAuthorize = parseStaffScanTargetInput({
		targetType: "roulette_authorize",
	});

	if (
		parsedAuthorize.targetType !== "roulette_authorize" ||
		parsedAuthorize.targetId !== ROULETTE_AUTHORIZE_TARGET_ID
	) {
		console.error("❌ parse roulette_authorize", parsedAuthorize);
		process.exit(1);
	}

	console.log("✅ parseStaffScanTargetInput roulette_authorize");

	assertDenied("map not enrolled", new RouletteNotEnrolled(), "not_enrolled", "activado");
	assertDenied(
		"map period expired",
		new RouletteParticipationPeriodExpired(),
		"not_enrolled",
		"periodo",
	);
	assertDenied(
		"map min purchase",
		new RouletteMinPurchaseNotMet(8, 10),
		"min_purchase",
		"mínimo 10",
	);
	assertDenied(
		"map pending auth",
		new RoulettePendingAuthorization(),
		"pending_auth",
		"pendiente",
	);
	assertDenied(
		"map period quota",
		new RouletteQuotaExhausted("period", 3),
		"quota_exhausted",
		"periodo",
	);
	assertDenied(
		"map daily quota",
		new RouletteQuotaExhausted("daily", 1),
		"daily_limit",
		"hoy",
	);

	const activationRepository = new InMemoryTenantGameActivationRepository();
	const participationRepository = new InMemoryRouletteParticipationRepository();
	const eligibilityRepository = new InMemoryRouletteSpinEligibilityRepository();
	const spinRepository = new InMemoryRouletteSpinRepository();
	const tenantRepository = new InMemoryTenantRepository();
	const customerRepository = new InMemoryCustomerRepository();
	const userRepository = new InMemoryUserRepository();

	activationRepository.setRow(
		TenantGameActivation.create({
			tenantId,
			gameSlug: RULETA_GAME_SLUG,
			isEnabled: true,
			config: v2Config,
		}),
	);

	const { enroll, authorize } = buildAuthorizeStack(
		activationRepository,
		participationRepository,
		eligibilityRepository,
		spinRepository,
	);

	const resolveCustomer = new ResolveCustomerByQrForStaffScan(customerRepository, userRepository);
	const recordAuthorize = new RecordStaffRouletteAuthorizeByQr(
		tenantRepository,
		resolveCustomer,
		authorize,
	);

	const denied = await recordAuthorize.execute({
		tenantId,
		qrValue: customerQr,
		purchaseAmountEuros: 15,
		createdByUserId: staffUserId,
		staffRole: TenantRole.Owner,
	});

	if (
		denied.outcomes.length !== 1 ||
		denied.outcomes[0]?.kind !== "roulette_auth_denied" ||
		(denied.outcomes[0] as { reasonCode: string }).reasonCode !== "not_enrolled"
	) {
		console.error("❌ RecordStaffRouletteAuthorizeByQr denied", denied.outcomes);
		process.exit(1);
	}

	console.log("✅ RecordStaffRouletteAuthorizeByQr → roulette_auth_denied not_enrolled");

	await enroll.execute({ tenantId, customerId });

	const granted = await recordAuthorize.execute({
		tenantId,
		qrValue: customerQr,
		purchaseAmountEuros: 15,
		createdByUserId: staffUserId,
		staffRole: TenantRole.Owner,
	});

	const grantedOutcome = granted.outcomes[0];

	if (
		granted.outcomes.length !== 1 ||
		grantedOutcome?.kind !== "roulette_auth_granted" ||
		grantedOutcome.purchaseAmountEuros !== 15 ||
		!grantedOutcome.expiresAt
	) {
		console.error("❌ RecordStaffRouletteAuthorizeByQr granted", granted.outcomes);
		process.exit(1);
	}

	console.log("✅ RecordStaffRouletteAuthorizeByQr → roulette_auth_granted");

	const rules = getParticipationRules(v2Config);
	const trackingIssue = new TrackingIssueRouletteSpinEligibility();
	const applyLoyalty = {
		applyStamp: async (): Promise<StaffScanOutcome[]> => [
			{
				kind: "stamp_added",
				campaignId,
				campaignName: "Verify",
				current: 1,
				required: 10,
			},
		],
		applyPromotion: async () => ({
			applied: false,
			promotionId: "p1",
			promotionTitle: "Promo",
			usedCount: 0,
			maxUsesPerUser: 1,
		}),
	} as never;

	const recordVisit = new RecordStaffScanByTarget(
		tenantRepository,
		customerRepository,
		resolveCustomer,
		{ save: async () => {} } as never,
		applyLoyalty,
		new GetTenantRouletteConfig(activationRepository),
		trackingIssue as never,
	);

	const visitResult = await recordVisit.execute({
		tenantId,
		qrValue: customerQr,
		targetType: "stamp_campaign",
		targetId: campaignId,
		createdByUserId: staffUserId,
		staffRole: TenantRole.Owner,
	});

	if (
		trackingIssue.called ||
		visitResult.outcomes.some((outcome) => outcome.kind === "roulette_spin_granted")
	) {
		console.error("❌ v2 stamp scan should not auto-grant roulette", {
			called: trackingIssue.called,
			outcomes: visitResult.outcomes,
		});
		process.exit(1);
	}

	console.log("✅ RecordStaffScanByTarget skips legacy eligibility on staff_explicit config");
	console.log("✅ verify:roulette-staff-authorize-use-case passed");
}

void main();
