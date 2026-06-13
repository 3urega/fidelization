/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { ResolveTenantSubscriptionPlan } from "../src/contexts/billing/subscriptions/application/resolve/ResolveTenantSubscriptionPlan";
import {
	BASIC_PLAN_FEATURES,
	PRO_PLAN_FEATURES,
} from "../src/contexts/billing/subscriptions/domain/SubscriptionPlanFeatures";
import { SubscriptionPlan } from "../src/contexts/billing/subscriptions/domain/SubscriptionPlan";
import { TenantBillingRepository } from "../src/contexts/billing/subscriptions/domain/TenantBillingRepository";
import { ListStaffScanTargets } from "../src/contexts/loyalty/customers/application/scan/ListStaffScanTargets";
import { StaffScanForbidden } from "../src/contexts/loyalty/customers/domain/StaffScanForbidden";
import { Promotion } from "../src/contexts/loyalty/promotions/domain/Promotion";
import { PromotionRepository } from "../src/contexts/loyalty/promotions/domain/PromotionRepository";
import { StampCampaign } from "../src/contexts/loyalty/stamp_campaigns/domain/StampCampaign";
import { StampCampaignRepository } from "../src/contexts/loyalty/stamp_campaigns/domain/StampCampaignRepository";
import { StampType } from "../src/contexts/loyalty/stamp_types/domain/StampType";
import { StampTypeRepository } from "../src/contexts/loyalty/stamp_types/domain/StampTypeRepository";
import { TenantRole } from "../src/contexts/tenants/memberships/domain/TenantRole";
import { Tenant } from "../src/contexts/tenants/tenants/domain/Tenant";
import { TenantRepository } from "../src/contexts/tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../src/contexts/tenants/tenants/domain/TenantStatus";

const tenantId = "00000000-0000-4000-8000-0000000000s1";
const planBasicId = "00000000-0000-4000-8000-000000000004";
const planProId = "00000000-0000-4000-8000-000000000006";
const cafeTypeId = "00000000-0000-4000-8000-0000000000t1";
const campaignActiveA = "00000000-0000-4000-8000-0000000000c1";
const campaignActiveB = "00000000-0000-4000-8000-0000000000c2";
const campaignInactive = "00000000-0000-4000-8000-0000000000c3";
const promoActiveId = "00000000-0000-4000-8000-0000000000p1";
const promoInactiveId = "00000000-0000-4000-8000-0000000000p2";
const promoExpiredId = "00000000-0000-4000-8000-0000000000p3";
const promoFutureId = "00000000-0000-4000-8000-0000000000p4";

const referenceAt = new Date("2026-06-13T12:00:00.000Z");

const planBasic = SubscriptionPlan.fromPrimitives({
	id: planBasicId,
	name: "basic",
	priceMonthly: 0,
	priceYearly: 0,
	features: BASIC_PLAN_FEATURES,
	limits: { employees: 3 },
	isActive: true,
});

const planPro = SubscriptionPlan.fromPrimitives({
	id: planProId,
	name: "pro",
	priceMonthly: 2900,
	priceYearly: 29000,
	features: PRO_PLAN_FEATURES,
	limits: { employees: 10 },
	isActive: true,
});

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

class InMemoryStampCampaignRepository extends StampCampaignRepository {
	constructor(private readonly campaigns: StampCampaign[]) {
		super();
	}

	async saveCampaign(): Promise<void> {}

	async deleteCampaign(): Promise<void> {}

	async searchCampaignById(): Promise<null> {
		return null;
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

	async searchProgress(): Promise<null> {
		return null;
	}

	async hasActiveGenericCampaigns(): Promise<boolean> {
		return false;
	}
}

class InMemoryStampTypeRepository extends StampTypeRepository {
	constructor(private readonly types: StampType[]) {
		super();
	}

	async save(): Promise<void> {}

	async searchById(tenantIdValue: string, id: string): Promise<StampType | null> {
		return this.types.find((type) => type.tenantId === tenantIdValue && type.id === id) ?? null;
	}

	async searchBySlug(): Promise<null> {
		return null;
	}

	async listByTenant(): Promise<StampType[]> {
		return this.types;
	}

	async listActiveByTenant(): Promise<StampType[]> {
		return this.types.filter((type) => type.isActive);
	}

	async countActiveByTenant(): Promise<number> {
		return this.types.filter((type) => type.isActive).length;
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

	async searchById(): Promise<null> {
		return null;
	}

	async listByTenant(): Promise<Promotion[]> {
		return this.promotions;
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

function baseTenant(planId: string, planName: string): Tenant {
	return Tenant.fromPrimitives({
		id: tenantId,
		name: "Staff Scan Targets Verify Cafe",
		slug: "staff-scan-targets-verify",
		logoUrl: "",
		primaryColor: "#7C3AED",
		secondaryColor: "#4F46E5",
		subscriptionPlan: planName,
		subscriptionPlanId: planId,
		status: TenantStatus.Active,
		createdAt: new Date().toISOString(),
	});
}

const cafeType = StampType.fromPrimitives({
	id: cafeTypeId,
	tenantId,
	label: "Café",
	slug: "cafe",
	sortOrder: 1,
	isActive: true,
});

const campaigns = [
	StampCampaign.fromPrimitives({
		id: campaignActiveA,
		tenantId,
		name: "10 cafés gratis",
		requiredStamps: 10,
		rewardId: null,
		stampTypeId: cafeTypeId,
		visualTemplate: "coffee",
		cardBackgroundVariant: "coffee-photo",
		conditions: "Válido de lunes a viernes",
		isActive: true,
	}),
	StampCampaign.fromPrimitives({
		id: campaignActiveB,
		tenantId,
		name: "5 cafés express",
		requiredStamps: 5,
		rewardId: null,
		stampTypeId: cafeTypeId,
		visualTemplate: "coffee",
		cardBackgroundVariant: "coffee-photo",
		conditions: "",
		isActive: true,
	}),
	StampCampaign.fromPrimitives({
		id: campaignInactive,
		tenantId,
		name: "Campaña inactiva",
		requiredStamps: 8,
		rewardId: null,
		stampTypeId: cafeTypeId,
		visualTemplate: "generic",
		cardBackgroundVariant: "coffee-photo",
		conditions: "",
		isActive: false,
	}),
];

const promotions = [
	Promotion.fromPrimitives({
		id: promoActiveId,
		tenantId,
		title: "2x1 pasteles",
		description: "Válido hoy",
		type: "discount",
		startDate: "2026-06-01T00:00:00.000Z",
		endDate: "2026-06-30T23:59:59.000Z",
		isActive: true,
		maxUsesPerUser: 3,
	}),
	Promotion.fromPrimitives({
		id: promoInactiveId,
		tenantId,
		title: "Promo inactiva",
		description: "No debe aparecer",
		type: "discount",
		startDate: null,
		endDate: null,
		isActive: false,
		maxUsesPerUser: null,
	}),
	Promotion.fromPrimitives({
		id: promoExpiredId,
		tenantId,
		title: "Promo expirada",
		description: "Fuera de ventana",
		type: "seasonal",
		startDate: "2026-01-01T00:00:00.000Z",
		endDate: "2026-05-31T23:59:59.000Z",
		isActive: true,
		maxUsesPerUser: 1,
	}),
	Promotion.fromPrimitives({
		id: promoFutureId,
		tenantId,
		title: "Promo futura",
		description: "Aún no empieza",
		type: "bundle",
		startDate: "2026-07-01T00:00:00.000Z",
		endDate: null,
		isActive: true,
		maxUsesPerUser: null,
	}),
];

function buildUseCase(plan: SubscriptionPlan): ListStaffScanTargets {
	const tenantRepository = new MutableStubTenantRepository(baseTenant(plan.id, plan.name));
	const billingRepository = new InMemoryTenantBillingRepository([planBasic, planPro]);
	const resolvePlan = new ResolveTenantSubscriptionPlan(tenantRepository, billingRepository);

	return new ListStaffScanTargets(
		tenantRepository,
		new InMemoryStampCampaignRepository(campaigns),
		new InMemoryStampTypeRepository([cafeType]),
		new InMemoryPromotionRepository(promotions),
		resolvePlan,
	);
}

async function expectForbidden(label: string, action: () => Promise<unknown>): Promise<void> {
	try {
		await action();
		console.error(`❌ expected StaffScanForbidden for ${label}`);
		process.exit(1);
	} catch (error) {
		if (!(error instanceof StaffScanForbidden)) {
			console.error(`❌ wrong error for ${label}`, error);
			process.exit(1);
		}
	}

	console.log(`✅ ${label} → StaffScanForbidden`);
}

async function main(): Promise<void> {
	process.env.DISABLE_TENANT_PLAN_GATES = "0";

	const originalDate = Date;
	global.Date = class extends originalDate {
		constructor(...args: ConstructorParameters<typeof Date>) {
			if (args.length === 0) {
				super(referenceAt.getTime());
				return;
			}

			super(...args);
		}

		static now(): number {
			return referenceAt.getTime();
		}
	} as DateConstructor;

	try {
		const proUseCase = buildUseCase(planPro);

		const ownerTargets = await proUseCase.execute({ tenantId, role: TenantRole.Owner });

		if (ownerTargets.stampCampaigns.length !== 2) {
			console.error("❌ expected 2 active campaigns", ownerTargets.stampCampaigns);
			process.exit(1);
		}

		const campaignIds = ownerTargets.stampCampaigns.map((campaign) => campaign.id).sort();
		if (
			campaignIds[0] !== campaignActiveA ||
			campaignIds[1] !== campaignActiveB ||
			ownerTargets.stampCampaigns.some((campaign) => campaign.id === campaignInactive)
		) {
			console.error("❌ inactive campaign excluded or wrong ids", ownerTargets);
			process.exit(1);
		}

		const firstCampaign = ownerTargets.stampCampaigns.find((campaign) => campaign.id === campaignActiveA);
		if (!firstCampaign || firstCampaign.stampTypeLabel !== "Café") {
			console.error("❌ stampTypeLabel not resolved", firstCampaign);
			process.exit(1);
		}

		console.log("✅ two active campaigns same stampTypeId → two rows");

		if (ownerTargets.promotions.length !== 1 || ownerTargets.promotions[0]?.id !== promoActiveId) {
			console.error("❌ Pro plan should include only active in-window promo", ownerTargets.promotions);
			process.exit(1);
		}

		console.log("✅ inactive/expired/future promos excluded on Pro");

		const employeeTargets = await proUseCase.execute({ tenantId, role: TenantRole.Employee });
		if (employeeTargets.stampCampaigns.length !== 2) {
			console.error("❌ employee should list campaigns", employeeTargets);
			process.exit(1);
		}

		console.log("✅ employee role allowed");

		await expectForbidden("customer role forbidden", () =>
			proUseCase.execute({ tenantId, role: TenantRole.Customer }),
		);

		const basicUseCase = buildUseCase(planBasic);
		const basicTargets = await basicUseCase.execute({ tenantId, role: TenantRole.Owner });

		if (basicTargets.stampCampaigns.length !== 2 || basicTargets.promotions.length !== 0) {
			console.error("❌ Basic plan should return empty promotions", basicTargets);
			process.exit(1);
		}

		console.log("✅ Basic plan → promotions: []");
		console.log("✅ verify:staff-scan-targets-use-case passed");
	} finally {
		global.Date = originalDate;
	}
}

void main();
