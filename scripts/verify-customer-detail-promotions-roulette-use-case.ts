/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { AssertTenantPlanFeature } from "../src/contexts/billing/subscriptions/application/guard/AssertTenantPlanFeature";
import { ResolveTenantSubscriptionPlan } from "../src/contexts/billing/subscriptions/application/resolve/ResolveTenantSubscriptionPlan";
import { PlanFeatureNotAvailable } from "../src/contexts/billing/subscriptions/domain/PlanFeatureNotAvailable";
import {
	PREMIUM_PLAN_FEATURES,
	PRO_PLAN_FEATURES,
	type SubscriptionPlanFeatures,
} from "../src/contexts/billing/subscriptions/domain/SubscriptionPlanFeatures";
import { SubscriptionPlan } from "../src/contexts/billing/subscriptions/domain/SubscriptionPlan";
import { TenantBillingRepository } from "../src/contexts/billing/subscriptions/domain/TenantBillingRepository";
import { GetTenantCustomerDetail } from "../src/contexts/loyalty/customers/application/analytics/GetTenantCustomerDetail";
import type {
	CustomerActivityRow,
	CustomerRedeemedRewardRow,
} from "../src/contexts/loyalty/customers/domain/analytics/CustomerDetail";
import type { CustomerAnalyticsRawRow } from "../src/contexts/loyalty/customers/domain/analytics/CustomerAnalyticsRawRow";
import type { CustomerNearRewardProgress } from "../src/contexts/loyalty/customers/domain/analytics/CustomerNearRewardProgress";
import {
	LoadCustomerAnalyticsSnapshotParams,
	TenantCustomerAnalyticsRepository,
} from "../src/contexts/loyalty/customers/domain/analytics/TenantCustomerAnalyticsRepository";
import { GetCustomerStampProgress } from "../src/contexts/loyalty/customers/application/profile/GetCustomerStampProgress";
import { createDefaultRouletteConfigV2 } from "../src/contexts/loyalty/games/domain/RouletteConfig";
import { ListRecentRouletteSpinsForCustomer } from "../src/contexts/loyalty/games/application/spin/ListRecentRouletteSpinsForCustomer";
import { RouletteSpin } from "../src/contexts/loyalty/games/domain/RouletteSpin";
import { RouletteSpinRepository } from "../src/contexts/loyalty/games/domain/RouletteSpinRepository";
import { ListCustomerPromotionSummaries } from "../src/contexts/loyalty/promotions/application/list/ListCustomerPromotionSummaries";
import { CustomerPromotionUsage } from "../src/contexts/loyalty/promotions/domain/CustomerPromotionUsage";
import { CustomerPromotionUsageRepository } from "../src/contexts/loyalty/promotions/domain/CustomerPromotionUsageRepository";
import { Promotion } from "../src/contexts/loyalty/promotions/domain/Promotion";
import { PromotionRepository } from "../src/contexts/loyalty/promotions/domain/PromotionRepository";
import { StampCampaignRepository } from "../src/contexts/loyalty/stamp_campaigns/domain/StampCampaignRepository";
import { StampTypeRepository } from "../src/contexts/loyalty/stamp_types/domain/StampTypeRepository";
import { TenantRole } from "../src/contexts/tenants/memberships/domain/TenantRole";
import { Tenant } from "../src/contexts/tenants/tenants/domain/Tenant";
import { TenantRepository } from "../src/contexts/tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../src/contexts/tenants/tenants/domain/TenantStatus";
import { customerZoneDetailToJson } from "../src/lib/auth/http";

const tenantId = "00000000-0000-4000-8000-000000001160";
const customerId = "00000000-0000-4000-8000-000000001161";
const promoId = "00000000-0000-4000-8000-000000001162";
const spinId = "00000000-0000-4000-8000-000000001163";
const planProId = "00000000-0000-4000-8000-000000000006";
const planPremiumId = "00000000-0000-4000-8000-000000000007";
const referenceDate = new Date("2026-06-15T12:00:00.000Z");

const configSnapshot = createDefaultRouletteConfigV2().toPrimitives();
const segmentId = configSnapshot.segments[0]?.id ?? "00000000-0000-4000-8000-000000000001";

const planPro = SubscriptionPlan.fromPrimitives({
	id: planProId,
	name: "pro",
	priceMonthly: 2900,
	priceYearly: 29000,
	features: PRO_PLAN_FEATURES,
	limits: { employees: 10 },
	isActive: true,
});

const planPremium = SubscriptionPlan.fromPrimitives({
	id: planPremiumId,
	name: "premium",
	priceMonthly: 4900,
	priceYearly: 49000,
	features: PREMIUM_PLAN_FEATURES,
	limits: { employees: 50 },
	isActive: true,
});

const snapshotRow: CustomerAnalyticsRawRow = {
	customerId,
	name: "Detail Promos Ruleta",
	email: "detail116@example.com",
	phone: null,
	createdAt: new Date("2025-01-01T10:00:00.000Z"),
	visitsCount: 12,
	pointsBalance: 12,
	lastVisitAt: new Date("2026-06-14T10:00:00.000Z"),
	visitsThisMonth: 3,
	totalStamps: 0,
	rewardsRedeemedCount: 0,
	nearRewardCampaigns: [],
};

class MutableStubTenantRepository extends TenantRepository {
	constructor(public tenant: Tenant | null) {
		super();
	}

	async findAll(): Promise<Tenant[]> {
		return this.tenant ? [this.tenant] : [];
	}

	async findById(id: string): Promise<Tenant | null> {
		return id === this.tenant?.id ? this.tenant : null;
	}

	async updateStatus(): Promise<Tenant | null> {
		return null;
	}

	async updateBranding(): Promise<Tenant | null> {
		return null;
	}
}

class InMemoryTenantBillingRepository extends TenantBillingRepository {
	constructor(private readonly plans: SubscriptionPlan[]) {
		super();
	}

	async savePlan(): Promise<void> {}

	async searchPlanByName(name: string): Promise<SubscriptionPlan | null> {
		return this.plans.find((plan) => plan.name === name) ?? null;
	}

	async searchPlanById(planId: string): Promise<SubscriptionPlan | null> {
		return this.plans.find((plan) => plan.id === planId) ?? null;
	}

	async listActivePlans(): Promise<SubscriptionPlan[]> {
		return this.plans.filter((plan) => plan.isActive);
	}

	async saveSubscription(): Promise<void> {}

	async searchActiveSubscription(): Promise<null> {
		return null;
	}

	async searchSubscriptionByStripeId(): Promise<null> {
		return null;
	}

	async updateSubscriptionStatus(): Promise<void> {}

	async linkTenantPlan(): Promise<void> {}
}

class InMemoryTenantCustomerAnalyticsRepository extends TenantCustomerAnalyticsRepository {
	constructor(private readonly rows: CustomerAnalyticsRawRow[]) {
		super();
	}

	async loadSnapshot(_params: LoadCustomerAnalyticsSnapshotParams): Promise<CustomerAnalyticsRawRow[]> {
		return this.rows.map((row) => ({ ...row, nearRewardCampaigns: [] }));
	}

	async loadNearRewardByTenant(): Promise<Map<string, CustomerNearRewardProgress[]>> {
		return new Map();
	}

	async findCustomerBase(_tenantId: string, id: string): Promise<CustomerAnalyticsRawRow | null> {
		return this.rows.find((row) => row.customerId === id) ?? null;
	}

	async loadRecentActivity(): Promise<CustomerActivityRow[]> {
		return [];
	}

	async loadRewardsRedeemed(): Promise<CustomerRedeemedRewardRow[]> {
		return [];
	}
}

class EmptyStampCampaignRepository extends StampCampaignRepository {
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

class EmptyStampTypeRepository extends StampTypeRepository {
	async save(): Promise<void> {}

	async searchById(): Promise<null> {
		return null;
	}

	async searchBySlug(): Promise<null> {
		return null;
	}

	async listByTenant(): Promise<never[]> {
		return [];
	}

	async listActiveByTenant(): Promise<never[]> {
		return [];
	}

	async countActiveByTenant(): Promise<number> {
		return 0;
	}

	async maxSortOrder(): Promise<number> {
		return 0;
	}
}

class InMemoryPromotionRepository extends PromotionRepository {
	constructor(private readonly promotions: Promotion[]) {
		super();
	}

	async save(): Promise<void> {}

	async searchById(tenantIdValue: string, id: string): Promise<Promotion | null> {
		return (
			this.promotions.find(
				(promotion) => promotion.id === id && promotion.tenantId === tenantIdValue,
			) ?? null
		);
	}

	async listByTenant(tenantIdValue: string): Promise<Promotion[]> {
		return this.promotions.filter((promotion) => promotion.tenantId === tenantIdValue);
	}

	async listActiveByTenantAt(tenantIdValue: string, at: Date): Promise<Promotion[]> {
		return this.promotions.filter((promotion) => {
			if (promotion.tenantId !== tenantIdValue || !promotion.isActive) {
				return false;
			}

			if (promotion.startDate && promotion.startDate > at) {
				return false;
			}

			if (promotion.endDate && promotion.endDate < at) {
				return false;
			}

			return true;
		});
	}
}

class InMemoryCustomerPromotionUsageRepository extends CustomerPromotionUsageRepository {
	constructor(private readonly usages: CustomerPromotionUsage[]) {
		super();
	}

	async searchUsage(
		tenantIdValue: string,
		customerIdValue: string,
		promotionIdValue: string,
	): Promise<CustomerPromotionUsage | null> {
		return (
			this.usages.find(
				(usage) =>
					usage.tenantId === tenantIdValue &&
					usage.customerId === customerIdValue &&
					usage.promotionId === promotionIdValue,
			) ?? null
		);
	}

	async save(): Promise<void> {}
}

class MemoryRouletteSpinRepository extends RouletteSpinRepository {
	constructor(private readonly spins: RouletteSpin[]) {
		super();
	}

	async save(): Promise<void> {}

	async searchById(): Promise<null> {
		return null;
	}

	async countByCustomerSince(): Promise<number> {
		return 0;
	}

	async countByCustomerBetween(): Promise<number> {
		return 0;
	}

	async listPendingRedeemByCustomer(): Promise<never[]> {
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

	async listByTenantBetween(): Promise<never[]> {
		return [];
	}
}

class StubAssertTenantPlanFeature {
	constructor(private readonly features: SubscriptionPlanFeatures) {}

	async execute(params: {
		tenantId: string;
		feature: "gamification";
	}): Promise<SubscriptionPlan> {
		if (!this.features.gamification) {
			throw new PlanFeatureNotAvailable(params.tenantId, params.feature);
		}

		return SubscriptionPlan.fromPrimitives({
			id: planPremiumId,
			name: "premium",
			priceMonthly: 0,
			priceYearly: 0,
			features: this.features,
			limits: { employees: 50 },
			isActive: true,
		});
	}
}

function tenantForPlan(plan: SubscriptionPlan): Tenant {
	return Tenant.fromPrimitives({
		id: tenantId,
		name: "Detail 116 Cafe",
		slug: "detail-116-cafe",
		logoUrl: "",
		primaryColor: "#7C3AED",
		secondaryColor: "#4F46E5",
		subscriptionPlan: plan.name,
		subscriptionPlanId: plan.id,
		status: TenantStatus.Active,
		createdAt: new Date().toISOString(),
	});
}

function buildGetDetail(
	tenant: Tenant,
	promotions: Promotion[],
	usages: CustomerPromotionUsage[],
	spins: RouletteSpin[],
	gamificationEnabled: boolean,
): GetTenantCustomerDetail {
	const tenantRepository = new MutableStubTenantRepository(tenant);
	const billingRepository = new InMemoryTenantBillingRepository([planPro, planPremium]);
	const resolvePlan = new ResolveTenantSubscriptionPlan(tenantRepository, billingRepository);
	const analyticsRepository = new InMemoryTenantCustomerAnalyticsRepository([snapshotRow]);
	const getCustomerStampProgress = new GetCustomerStampProgress(
		tenantRepository,
		new EmptyStampCampaignRepository(),
		new EmptyStampTypeRepository(),
	);
	const listPromotions = new ListCustomerPromotionSummaries(
		tenantRepository,
		new InMemoryPromotionRepository(promotions),
		new InMemoryCustomerPromotionUsageRepository(usages),
		resolvePlan,
	);
	const features = gamificationEnabled ? PREMIUM_PLAN_FEATURES : PRO_PLAN_FEATURES;
	const assertFeature = new StubAssertTenantPlanFeature(features) as unknown as AssertTenantPlanFeature;
	const listSpins = new ListRecentRouletteSpinsForCustomer(new MemoryRouletteSpinRepository(spins));

	return new GetTenantCustomerDetail(
		tenantRepository,
		analyticsRepository,
		getCustomerStampProgress,
		listPromotions,
		assertFeature,
		listSpins,
	);
}

function assert(condition: boolean, message: string): void {
	if (!condition) {
		console.error(`❌ ${message}`);
		process.exit(1);
	}
}

async function main(): Promise<void> {
	const activePromo = Promotion.fromPrimitives({
		id: promoId,
		tenantId,
		title: "2x1 verano",
		description: "Verify detail promo",
		type: "discount",
		startDate: null,
		endDate: null,
		isActive: true,
		maxUsesPerUser: 3,
	});
	const usage = CustomerPromotionUsage.fromPrimitives({
		id: "00000000-0000-4000-8000-000000001164",
		tenantId,
		customerId,
		promotionId: promoId,
		usedCount: 2,
	});

	const proDetail = await buildGetDetail(
		tenantForPlan(planPro),
		[activePromo],
		[usage],
		[],
		false,
	).execute({
		tenantId,
		customerId,
		role: TenantRole.Owner,
		referenceDate,
	});

	assert(proDetail.promotions.length === 1, "expected one promotion on Pro");
	assert(proDetail.promotions[0]?.usedCount === 2, "expected usedCount 2");
	assert(proDetail.promotions[0]?.maxUsesPerUser === 3, "expected maxUsesPerUser 3");
	assert(proDetail.rouletteSpins.length === 0, "Pro plan → empty rouletteSpins");

	console.log("✅ Pro tenant → promotions with usage, no roulette");

	const spin = RouletteSpin.fromPrimitives({
		id: spinId,
		tenantId,
		customerId,
		segmentId,
		segmentIndex: 0,
		prizeType: "points",
		prizePayload: { points: 10 },
		status: "applied",
		triggerSource: "staff_scan",
		triggerRef: null,
		idempotencyKey: null,
		configSnapshot,
		createdAt: "2026-06-15T11:00:00.000Z",
		redeemedAt: null,
	});

	const premiumDetail = await buildGetDetail(
		tenantForPlan(planPremium),
		[activePromo],
		[usage],
		[spin],
		true,
	).execute({
		tenantId,
		customerId,
		role: TenantRole.Owner,
		referenceDate,
	});

	assert(premiumDetail.rouletteSpins.length === 1, "expected one roulette spin");
	assert(
		premiumDetail.rouletteSpins[0]?.segmentLabel.length > 0,
		"expected segment label on spin",
	);
	assert(premiumDetail.rouletteSpins[0]?.prizeType === "points", "expected points prize");
	assert(premiumDetail.rouletteSpins[0]?.status === "applied", "expected applied status");

	console.log("✅ Premium tenant → roulette history on detail");

	const json = customerZoneDetailToJson(premiumDetail);

	assert(Array.isArray(json.promotions) && json.promotions.length === 1, "json promotions");
	assert(Array.isArray(json.rouletteSpins) && json.rouletteSpins.length === 1, "json rouletteSpins");
	assert(typeof json.rouletteSpins[0]?.createdAt === "string", "json spin createdAt ISO");

	console.log("✅ customerZoneDetailToJson includes promotions + rouletteSpins");

	console.log("✅ verify:customer-detail-promotions-roulette-use-case passed");
}

void main();
