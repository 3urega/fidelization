/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { AssertTenantPlanFeature } from "../src/contexts/billing/subscriptions/application/guard/AssertTenantPlanFeature";
import { ResolveTenantSubscriptionPlan } from "../src/contexts/billing/subscriptions/application/resolve/ResolveTenantSubscriptionPlan";
import { PRO_PLAN_FEATURES } from "../src/contexts/billing/subscriptions/domain/SubscriptionPlanFeatures";
import { SubscriptionPlan } from "../src/contexts/billing/subscriptions/domain/SubscriptionPlan";
import { TenantBillingRepository } from "../src/contexts/billing/subscriptions/domain/TenantBillingRepository";
import type { GetStaffRouletteScanContextResult } from "../src/contexts/loyalty/games/application/config/GetStaffRouletteScanContext";
import type { GetRouletteParticipationStateResult } from "../src/contexts/loyalty/games/application/participation/GetRouletteParticipationState";
import { RouletteSpinRepository } from "../src/contexts/loyalty/games/domain/RouletteSpinRepository";
import { GetStaffScanSessionContext } from "../src/contexts/loyalty/customers/application/scan/GetStaffScanSessionContext";
import { ResolveCustomerByQrForStaffScan } from "../src/contexts/loyalty/customers/application/scan/ResolveCustomerByQrForStaffScan";
import { Customer } from "../src/contexts/loyalty/customers/domain/Customer";
import { CustomerRepository } from "../src/contexts/loyalty/customers/domain/CustomerRepository";
import { InvalidStampScan } from "../src/contexts/loyalty/customers/domain/InvalidStampScan";
import {
	resolveStaffScanPromotion,
	resolveStaffScanStampCard,
} from "../src/contexts/loyalty/customers/domain/StaffScanSession";
import { StaffScanForbidden } from "../src/contexts/loyalty/customers/domain/StaffScanForbidden";
import { GetCustomerStampProgress } from "../src/contexts/loyalty/customers/application/profile/GetCustomerStampProgress";
import { ListCustomerPromotionSummaries } from "../src/contexts/loyalty/promotions/application/list/ListCustomerPromotionSummaries";
import { CustomerPromotionUsage } from "../src/contexts/loyalty/promotions/domain/CustomerPromotionUsage";
import { CustomerPromotionUsageRepository } from "../src/contexts/loyalty/promotions/domain/CustomerPromotionUsageRepository";
import { Promotion } from "../src/contexts/loyalty/promotions/domain/Promotion";
import { PromotionRepository } from "../src/contexts/loyalty/promotions/domain/PromotionRepository";
import { CustomerStampProgress } from "../src/contexts/loyalty/stamp_campaigns/domain/CustomerStampProgress";
import { StampCampaign } from "../src/contexts/loyalty/stamp_campaigns/domain/StampCampaign";
import { StampCampaignRepository } from "../src/contexts/loyalty/stamp_campaigns/domain/StampCampaignRepository";
import { StampTypeRepository } from "../src/contexts/loyalty/stamp_types/domain/StampTypeRepository";
import { TenantRole } from "../src/contexts/tenants/memberships/domain/TenantRole";
import { Tenant } from "../src/contexts/tenants/tenants/domain/Tenant";
import { TenantRepository } from "../src/contexts/tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../src/contexts/tenants/tenants/domain/TenantStatus";

const tenantId = "00000000-0000-4000-8000-0000000000y1";
const planProId = "00000000-0000-4000-8000-000000000006";
const customerId = "00000000-0000-4000-8000-0000000000cu";
const campaignId = "00000000-0000-4000-8000-0000000000ca";
const promoId = "00000000-0000-4000-8000-0000000000pr";
const customerQr = "staff-session-verify-qr";

const planPro = SubscriptionPlan.fromPrimitives({
	id: planProId,
	name: "pro",
	priceMonthly: 2900,
	priceYearly: 29000,
	features: PRO_PLAN_FEATURES,
	limits: { employees: 10 },
	isActive: true,
});

class StubTenantRepository extends TenantRepository {
	constructor(private readonly tenant: Tenant) {
		super();
	}

	async findAll(): Promise<Tenant[]> {
		return [this.tenant];
	}

	async findById(id: string): Promise<Tenant | null> {
		return id === this.tenant.id ? this.tenant : null;
	}

	async updateStatus(): Promise<Tenant | null> {
		return null;
	}

	async updateBranding(): Promise<Tenant | null> {
		return null;
	}
}

class InMemoryCustomerRepository extends CustomerRepository {
	constructor(private readonly customers: Customer[]) {
		super();
	}

	async save(customer: Customer): Promise<void> {
		const index = this.customers.findIndex((row) => row.id === customer.id);
		if (index >= 0) {
			this.customers[index] = customer;
		} else {
			this.customers.push(customer);
		}
	}

	async searchById(tenantIdValue: string, id: string): Promise<Customer | null> {
		return (
			this.customers.find((row) => row.tenantId === tenantIdValue && row.id === id) ?? null
		);
	}

	async searchByQrValue(tenantIdValue: string, qrValue: string): Promise<Customer | null> {
		return (
			this.customers.find(
				(row) => row.tenantId === tenantIdValue && row.qrValue === qrValue,
			) ?? null
		);
	}

	async searchByUserIdAndTenantId(): Promise<Customer | null> {
		return null;
	}

	async listWithInteractionByUserId(): Promise<[]> {
		return [];
	}
}

class InMemoryStampCampaignRepository extends StampCampaignRepository {
	constructor(
		private readonly campaigns: StampCampaign[],
		private readonly progressByKey: Map<string, CustomerStampProgress>,
	) {
		super();
	}

	async saveCampaign(): Promise<void> {}

	async deleteCampaign(): Promise<void> {}

	async searchCampaignById(tenantIdValue: string, id: string): Promise<StampCampaign | null> {
		const campaign = this.campaigns.find((row) => row.id === id);

		return campaign && campaign.tenantId === tenantIdValue ? campaign : null;
	}

	async listByTenant(): Promise<StampCampaign[]> {
		return this.campaigns;
	}

	async listActiveByTenant(tenantIdValue: string): Promise<StampCampaign[]> {
		return this.campaigns.filter(
			(campaign) => campaign.tenantId === tenantIdValue && campaign.isActive,
		);
	}

	async saveProgress(): Promise<void> {}

	async searchProgress(
		tenantIdValue: string,
		cId: string,
		campaign: string,
	): Promise<CustomerStampProgress | null> {
		const row = this.progressByKey.get(`${cId}:${campaign}`);

		return row && row.tenantId === tenantIdValue ? row : null;
	}

	async hasActiveGenericCampaigns(): Promise<boolean> {
		return false;
	}
}

class InMemoryStampTypeRepository extends StampTypeRepository {
	async save(): Promise<void> {}

	async searchById(): Promise<null> {
		return null;
	}

	async searchBySlug(): Promise<null> {
		return null;
	}

	async listByTenant(): Promise<[]> {
		return [];
	}

	async listActiveByTenant(): Promise<[]> {
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

	async listActiveByTenantAt(t: string): Promise<Promotion[]> {
		return t === tenantId ? this.promotions : [];
	}

	async searchById(): Promise<Promotion | null> {
		return null;
	}

	async save(): Promise<void> {}

	async listByTenant(): Promise<Promotion[]> {
		return this.promotions;
	}
}

class InMemoryCustomerPromotionUsageRepository extends CustomerPromotionUsageRepository {
	constructor(private readonly usedCount: number) {
		super();
	}

	async searchUsage(): Promise<CustomerPromotionUsage | null> {
		return CustomerPromotionUsage.fromPrimitives({
			id: "00000000-0000-4000-8000-0000000000us",
			tenantId,
			customerId,
			promotionId: promoId,
			usedCount: this.usedCount,
		});
	}

	async saveUsage(): Promise<void> {}
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

class StubRouletteSpinRepository extends RouletteSpinRepository {
	constructor(private readonly pendingCount: number) {
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

	async listPendingRedeemByCustomer(): Promise<[]> {
		return Array.from({ length: this.pendingCount }, () => []) as [];
	}

	async listRecentByCustomer(): Promise<[]> {
		return [];
	}

	async listByTenantBetween(): Promise<[]> {
		return [];
	}
}

function assertHelpers(): void {
	const stamp = resolveStaffScanStampCard({
		campaignId,
		campaignName: "Café",
		current: 3,
		required: 10,
		completed: false,
		stampTypeId: null,
		stampTypeLabel: "Visita general",
		visualTemplate: "classic",
		cardBackgroundVariant: "default",
		conditions: "",
	});

	if (!stamp.canAddStamp || stamp.blockReason !== undefined) {
		console.error("❌ resolveStaffScanStampCard active");
		process.exit(1);
	}

	const completed = resolveStaffScanStampCard({ ...stamp, current: 10, completed: true });

	if (completed.canAddStamp || completed.blockReason !== "completed") {
		console.error("❌ resolveStaffScanStampCard completed");
		process.exit(1);
	}

	const promoExhausted = resolveStaffScanPromotion({
		id: promoId,
		title: "Promo",
		description: "Desc",
		maxUsesPerUser: 3,
		usedCount: 3,
		isActive: true,
	});

	if (promoExhausted.canApply || promoExhausted.blockReason !== "exhausted") {
		console.error("❌ resolveStaffScanPromotion exhausted");
		process.exit(1);
	}

	console.log("✅ StaffScanSession domain helpers");
}

function buildCustomer(): Customer {
	return Customer.fromPrimitives({
		id: customerId,
		tenantId,
		userId: null,
		name: "Session Customer",
		email: null,
		phone: null,
		qrValue: customerQr,
		pointsBalance: 7,
		visitsCount: 4,
	});
}

function buildCampaign(): StampCampaign {
	return StampCampaign.fromPrimitives({
		id: campaignId,
		tenantId,
		name: "Tarjeta session",
		requiredStamps: 10,
		rewardId: null,
		stampTypeId: null,
		visualTemplate: "classic",
		cardBackgroundVariant: "default",
		conditions: "",
		isActive: true,
	});
}

function buildPromotion(): Promotion {
	return Promotion.fromPrimitives({
		id: promoId,
		tenantId,
		title: "Promo session",
		description: "2x1",
		type: "discount",
		startDate: null,
		endDate: null,
		isActive: true,
		maxUsesPerUser: 2,
	});
}

function buildProgress(currentStamps: number): CustomerStampProgress {
	return CustomerStampProgress.fromPrimitives({
		id: "00000000-0000-4000-8000-0000000000pg",
		tenantId,
		customerId,
		campaignId,
		currentStamps,
		completed: false,
	});
}

function buildUseCase(options: {
	currentStamps: number;
	promoUsedCount: number;
	spinsRemainingToday: number;
	pendingCount: number;
	gamification: boolean;
}): GetStaffScanSessionContext {
	const tenant = Tenant.fromPrimitives({
		id: tenantId,
		name: "Session Verify",
		slug: "session-verify",
		logoUrl: "",
		primaryColor: "#7C3AED",
		secondaryColor: "#4F46E5",
		subscriptionPlan: "pro",
		subscriptionPlanId: planProId,
		status: TenantStatus.Active,
		createdAt: new Date().toISOString(),
	});
	const customer = buildCustomer();
	const progressMap = new Map<string, CustomerStampProgress>([
		[`${customerId}:${campaignId}`, buildProgress(options.currentStamps)],
	]);
	const tenantRepo = new StubTenantRepository(tenant);
	const billing = new InMemoryTenantBillingRepository([planPro]);
	const resolvePlan = new ResolveTenantSubscriptionPlan(tenantRepo, billing);
	const enabledFeatures = new Set(
		options.gamification ? ["gamification", "promotions"] : ["promotions"],
	);
	const assertFeature = {
		execute: async (params: { feature: string }) => {
			if (!enabledFeatures.has(params.feature)) {
				throw new Error(`feature ${params.feature} disabled`);
			}
		},
	} as AssertTenantPlanFeature;

	const rouletteContext = {
		execute: async (): Promise<GetStaffRouletteScanContextResult> => ({
			unlockEnabled: false,
			authorizeEnabled: true,
			minPurchaseEuros: 5,
		}),
	};

	const participation = {
		execute: async (): Promise<GetRouletteParticipationStateResult> => ({
			status: "active",
			enrolledAt: "2026-01-01T00:00:00.000Z",
			periodEndsAt: null,
			rules: {
				participationPeriodDays: 7,
				maxSpinsInPeriod: 3,
				maxSpinsPerDay: 1,
				minPurchaseEuros: 5,
				participationConditionsText: null,
				requiresEnrollment: true,
			},
			spinsUsedInPeriod: 1,
			spinsRemainingInPeriod: 2,
			spinsUsedToday: 1,
			spinsRemainingToday: options.spinsRemainingToday,
			pendingAuthorization: null,
		}),
	};

	const customerRepo = new InMemoryCustomerRepository([customer]);

	return new GetStaffScanSessionContext(
		tenantRepo,
		customerRepo,
		new ResolveCustomerByQrForStaffScan(customerRepo, {
			searchByQrValue: async () => null,
		} as never),
		new GetCustomerStampProgress(
			tenantRepo,
			new InMemoryStampCampaignRepository([buildCampaign()], progressMap),
			new InMemoryStampTypeRepository(),
		),
		new ListCustomerPromotionSummaries(
			tenantRepo,
			new InMemoryPromotionRepository([buildPromotion()]),
			new InMemoryCustomerPromotionUsageRepository(options.promoUsedCount),
			resolvePlan,
		),
		resolvePlan,
		assertFeature,
		rouletteContext as never,
		participation as never,
		new StubRouletteSpinRepository(options.pendingCount),
	);
}

async function assertUseCase(): Promise<void> {
	const useCase = buildUseCase({
		currentStamps: 3,
		promoUsedCount: 1,
		spinsRemainingToday: 0,
		pendingCount: 2,
		gamification: true,
	});

	const byCustomerId = await useCase.execute({
		tenantId,
		role: TenantRole.Owner,
		customerId,
	});

	if (byCustomerId.stampCards[0]?.current !== 3 || byCustomerId.stampCards[0]?.required !== 10) {
		console.error("❌ stamp progress 3/10", byCustomerId.stampCards[0]);
		process.exit(1);
	}

	if (byCustomerId.roulette?.participation.spinsRemainingToday !== 0) {
		console.error("❌ spinsRemainingToday", byCustomerId.roulette?.participation);
		process.exit(1);
	}

	if (byCustomerId.roulette?.pendingPhysicalCount !== 2) {
		console.error("❌ pendingPhysicalCount", byCustomerId.roulette?.pendingPhysicalCount);
		process.exit(1);
	}

	if (!byCustomerId.promotions[0]?.canApply) {
		console.error("❌ promotion canApply", byCustomerId.promotions[0]);
		process.exit(1);
	}

	if (!byCustomerId.tenantCapabilities.roulette?.authorizeEnabled) {
		console.error("❌ tenantCapabilities.roulette", byCustomerId.tenantCapabilities);
		process.exit(1);
	}

	const byQr = await useCase.execute({
		tenantId,
		role: TenantRole.Employee,
		qrValue: customerQr,
	});

	if (byQr.customer.id !== customerId) {
		console.error("❌ resolve by qr", byQr.customer);
		process.exit(1);
	}

	try {
		await useCase.execute({ tenantId, role: TenantRole.Owner, qrValue: "a", customerId: "b" });
		console.error("❌ expected InvalidStampScan for both params");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof InvalidStampScan)) {
			console.error("❌ expected InvalidStampScan", error);
			process.exit(1);
		}
	}

	try {
		await useCase.execute({ tenantId, role: TenantRole.Owner });
		console.error("❌ expected InvalidStampScan for missing params");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof InvalidStampScan)) {
			console.error("❌ expected InvalidStampScan missing", error);
			process.exit(1);
		}
	}

	try {
		await buildUseCase({
			currentStamps: 0,
			promoUsedCount: 0,
			spinsRemainingToday: 1,
			pendingCount: 0,
			gamification: true,
		}).execute({ tenantId, role: "customer" as TenantRole, customerId });
		console.error("❌ expected StaffScanForbidden");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof StaffScanForbidden)) {
			console.error("❌ expected StaffScanForbidden", error);
			process.exit(1);
		}
	}

	console.log("✅ GetStaffScanSessionContext");
}

async function main(): Promise<void> {
	assertHelpers();
	await assertUseCase();
	console.log("✅ verify:staff-scan-session-use-case passed");
}

void main();
