/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { AssertTenantPlanFeature } from "../src/contexts/billing/subscriptions/application/guard/AssertTenantPlanFeature";
import { ListPlatformSubscriptionPlans } from "../src/contexts/billing/subscriptions/application/list/ListPlatformSubscriptionPlans";
import { ResolveTenantEffectivePlanFeatures } from "../src/contexts/billing/subscriptions/application/resolve/ResolveTenantEffectivePlanFeatures";
import { ResolveTenantSubscriptionPlan } from "../src/contexts/billing/subscriptions/application/resolve/ResolveTenantSubscriptionPlan";
import { UpdateSubscriptionPlan } from "../src/contexts/billing/subscriptions/application/update/UpdateSubscriptionPlan";
import {
	BASIC_PLAN_FEATURES,
	PRO_PLAN_FEATURES,
} from "../src/contexts/billing/subscriptions/domain/SubscriptionPlanFeatures";
import { SubscriptionPlan } from "../src/contexts/billing/subscriptions/domain/SubscriptionPlan";
import { TenantBillingRepository } from "../src/contexts/billing/subscriptions/domain/TenantBillingRepository";
import type { TenantFeatureOverrides } from "../src/contexts/billing/subscriptions/domain/TenantFeatureOverrides";
import {
	ListPlatformPlanFeatures,
	UpdatePlatformPlanFeatures,
} from "../src/contexts/platform/application/features/PlatformPlanFeatures";
import {
	GetPlatformTenantFeatures,
	UpdatePlatformTenantFeatures,
} from "../src/contexts/platform/application/features/PlatformTenantFeatures";
import { Tenant } from "../src/contexts/tenants/tenants/domain/Tenant";
import { TenantRepository } from "../src/contexts/tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../src/contexts/tenants/tenants/domain/TenantStatus";

const tenantId = "00000000-0000-4000-8000-0000000000f7";
const planBasicId = "00000000-0000-4000-8000-000000000004";
const planProId = "00000000-0000-4000-8000-000000000006";

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

class MutableBillingRepository extends TenantBillingRepository {
	constructor(private plans: SubscriptionPlan[]) {
		super();
	}

	async savePlan(plan: SubscriptionPlan): Promise<void> {
		this.plans = this.plans.map((row) => (row.id === plan.id ? plan : row));
	}

	async searchPlanByName(name: string): Promise<SubscriptionPlan | null> {
		return this.plans.find((plan) => plan.name === name) ?? null;
	}

	async searchPlanById(planId: string): Promise<SubscriptionPlan | null> {
		return this.plans.find((plan) => plan.id === planId) ?? null;
	}

	async listActivePlans(): Promise<SubscriptionPlan[]> {
		return this.plans.filter((plan) => plan.isActive);
	}

	async listAllPlans(): Promise<SubscriptionPlan[]> {
		return [...this.plans];
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

class MutableTenantRepository extends TenantRepository {
	constructor(
		private readonly tenant: Tenant,
		private featureOverrides: TenantFeatureOverrides | null = null,
	) {
		super();
	}

	async findAll(): Promise<Tenant[]> {
		return [this.tenant];
	}

	async findById(id: string): Promise<Tenant | null> {
		return id === this.tenant.id ? this.tenant : null;
	}

	async updateStatus(): Promise<Tenant | null> {
		return this.tenant;
	}

	async updateBranding(): Promise<Tenant | null> {
		return this.tenant;
	}

	async findFeatureOverrides(_tenantId: string): Promise<TenantFeatureOverrides | null> {
		return this.featureOverrides;
	}

	async updateFeatureOverrides(
		_tenantId: string,
		overrides: TenantFeatureOverrides | null,
	): Promise<void> {
		this.featureOverrides = overrides;
	}
}

async function main(): Promise<void> {
	process.env.DISABLE_TENANT_PLAN_GATES = "0";

	const billingRepository = new MutableBillingRepository([planBasic, planPro]);
	const listPlans = new ListPlatformPlanFeatures(
		new ListPlatformSubscriptionPlans(billingRepository),
	);
	const updatePlanFeatures = new UpdatePlatformPlanFeatures(
		new UpdateSubscriptionPlan(billingRepository),
	);

	const catalog = await listPlans.execute();
	if (catalog.plans.length !== 2 || catalog.featureCatalog.length < 8) {
		console.error("❌ ListPlatformPlanFeatures", catalog);
		process.exit(1);
	}

	console.log("✅ ListPlatformPlanFeatures returns plans + catalog");

	const updatedPlan = await updatePlanFeatures.execute({
		planId: planProId,
		features: { ...PRO_PLAN_FEATURES, referrals: false },
	});

	if (updatedPlan.toPrimitives().features.referrals) {
		console.error("❌ UpdatePlatformPlanFeatures did not persist", updatedPlan.toPrimitives());
		process.exit(1);
	}

	console.log("✅ UpdatePlatformPlanFeatures persists plan flags");

	const tenant = Tenant.fromPrimitives({
		id: tenantId,
		name: "Features Verify Cafe",
		slug: "features-verify",
		logoUrl: "",
		primaryColor: "#7C3AED",
		secondaryColor: "#4F46E5",
		subscriptionPlan: "basic",
		subscriptionPlanId: planBasicId,
		status: TenantStatus.Active,
		createdAt: "2026-06-01T10:00:00.000Z",
	});

	const tenantRepository = new MutableTenantRepository(tenant);
	const resolvePlan = new ResolveTenantSubscriptionPlan(tenantRepository, billingRepository);
	const resolveEffective = new ResolveTenantEffectivePlanFeatures(resolvePlan, tenantRepository);
	const getTenantFeatures = new GetPlatformTenantFeatures(tenantRepository, resolveEffective);
	const updateTenantFeatures = new UpdatePlatformTenantFeatures(tenantRepository, getTenantFeatures);
	const assertFeature = new AssertTenantPlanFeature(resolveEffective);

	await assertFeature.execute({ tenantId, feature: "stamps" });
	console.log("✅ Basic tenant allows stamps before override");

	try {
		await assertFeature.execute({ tenantId, feature: "promotions" });
		console.error("❌ Basic tenant should block promotions without override");
		process.exit(1);
	} catch {
		console.log("✅ Basic tenant blocks promotions without override");
	}

	const withOverride = await updateTenantFeatures.execute({
		tenantId,
		overrides: { promotions: true },
	});

	if (!withOverride.effectiveFeatures.promotions) {
		console.error("❌ tenant override should enable promotions", withOverride);
		process.exit(1);
	}

	await assertFeature.execute({ tenantId, feature: "promotions" });
	console.log("✅ tenant override enables promotions on Basic");

	const cleared = await updateTenantFeatures.execute({ tenantId, overrides: null });
	if (cleared.overrides !== null || cleared.effectiveFeatures.promotions) {
		console.error("❌ clearing overrides should revert to plan", cleared);
		process.exit(1);
	}

	console.log("✅ clearing tenant overrides reverts to plan features");
	console.log("✅ verify:platform-admin-features-use-case passed");
}

void main();
