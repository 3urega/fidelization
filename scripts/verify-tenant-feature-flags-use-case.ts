/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { AssertTenantEmployeeLimit } from "../src/contexts/billing/subscriptions/application/guard/AssertTenantEmployeeLimit";
import { AssertTenantPlanFeature } from "../src/contexts/billing/subscriptions/application/guard/AssertTenantPlanFeature";
import { ResolveTenantEffectivePlanFeatures } from "../src/contexts/billing/subscriptions/application/resolve/ResolveTenantEffectivePlanFeatures";
import { ResolveTenantSubscriptionPlan } from "../src/contexts/billing/subscriptions/application/resolve/ResolveTenantSubscriptionPlan";
import { ListPromotions } from "../src/contexts/loyalty/promotions/application/list/ListPromotions";
import { Promotion } from "../src/contexts/loyalty/promotions/domain/Promotion";
import { PromotionRepository } from "../src/contexts/loyalty/promotions/domain/PromotionRepository";
import { PlanFeatureNotAvailable } from "../src/contexts/billing/subscriptions/domain/PlanFeatureNotAvailable";
import {
	BASIC_PLAN_FEATURES,
	PREMIUM_PLAN_FEATURES,
	PRO_PLAN_FEATURES,
} from "../src/contexts/billing/subscriptions/domain/SubscriptionPlanFeatures";
import { SubscriptionPlan } from "../src/contexts/billing/subscriptions/domain/SubscriptionPlan";
import { TenantBillingRepository } from "../src/contexts/billing/subscriptions/domain/TenantBillingRepository";
import { TenantPlanLimitExceeded } from "../src/contexts/billing/subscriptions/domain/TenantPlanLimitExceeded";
import {
	type TenantFeatureOverrides,
} from "../src/contexts/billing/subscriptions/domain/TenantFeatureOverrides";
import { TenantRole } from "../src/contexts/tenants/memberships/domain/TenantRole";
import { TenantEmployee } from "../src/contexts/tenants/memberships/domain/TenantEmployee";
import { TenantMembershipRepository } from "../src/contexts/tenants/memberships/domain/TenantMembershipRepository";
import { Tenant } from "../src/contexts/tenants/tenants/domain/Tenant";
import { TenantRepository } from "../src/contexts/tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../src/contexts/tenants/tenants/domain/TenantStatus";

const tenantId = "00000000-0000-4000-8000-0000000000f1";
const planBasicId = "00000000-0000-4000-8000-000000000004";
const planProId = "00000000-0000-4000-8000-000000000006";
const planPremiumId = "00000000-0000-4000-8000-000000000007";

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

const planPremium = SubscriptionPlan.fromPrimitives({
	id: planPremiumId,
	name: "premium",
	priceMonthly: 5900,
	priceYearly: 59000,
	features: PREMIUM_PLAN_FEATURES,
	limits: { employees: 50 },
	isActive: true,
});

class InMemoryPromotionRepository extends PromotionRepository {
	async save(): Promise<void> {}

	async searchById(): Promise<Promotion | null> {
		return null;
	}

	async listByTenant(): Promise<Promotion[]> {
		return [];
	}

	async listActiveByTenantAt(): Promise<Promotion[]> {
		return [];
	}
}

class MutableStubTenantRepository extends TenantRepository {
	constructor(
		public tenant: Tenant | null,
		private featureOverrides: TenantFeatureOverrides | null = null,
	) {
		super();
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

class InMemoryTenantMembershipRepository extends TenantMembershipRepository {
	constructor(private employees: TenantEmployee[] = []) {
		super();
	}

	async findStaffMembership(): Promise<null> {
		return null;
	}

	async findFirstStaffMembershipByUserId(): Promise<null> {
		return null;
	}

	async findOwnerMembershipByUserId(): Promise<null> {
		return null;
	}

	async findById(): Promise<null> {
		return null;
	}

	async createStaffMembership(): Promise<{ membershipId: string }> {
		return { membershipId: "new-membership" };
	}

	async listEmployeesByTenant(): Promise<TenantEmployee[]> {
		return this.employees;
	}
}

function baseTenant(planId: string, planName: string): Tenant {
	return Tenant.fromPrimitives({
		id: tenantId,
		name: "Feature Flags Verify Cafe",
		slug: "feature-flags-verify",
		logoUrl: "",
		primaryColor: "#7C3AED",
		secondaryColor: "#4F46E5",
		subscriptionPlan: planName,
		subscriptionPlanId: planId,
		status: TenantStatus.Active,
		createdAt: new Date().toISOString(),
	});
}

function employee(index: number): TenantEmployee {
	return {
		membershipId: `00000000-0000-4000-8000-0000000000e${index}`,
		userId: `00000000-0000-4000-8000-0000000000u${index}`,
		name: `Employee ${index}`,
		email: `employee${index}@example.local`,
		role: TenantRole.Employee,
	};
}

async function expectError<T extends Error>(
	label: string,
	action: () => Promise<unknown>,
	Expected: new (...args: never[]) => T,
): Promise<void> {
	try {
		await action();
		console.error(`❌ expected ${Expected.name} for ${label}`);
		process.exit(1);
	} catch (error) {
		if (!(error instanceof Expected)) {
			console.error(`❌ wrong error for ${label}`, error);
			process.exit(1);
		}
	}

	console.log(`✅ ${label} → ${Expected.name}`);
}

function buildStack(
	plan: SubscriptionPlan,
	employees: TenantEmployee[] = [],
	featureOverrides: TenantFeatureOverrides | null = null,
) {
	const tenantRepository = new MutableStubTenantRepository(
		baseTenant(plan.id, plan.name),
		featureOverrides,
	);
	const billingRepository = new InMemoryTenantBillingRepository([planBasic, planPro, planPremium]);
	const membershipRepository = new InMemoryTenantMembershipRepository(employees);
	const resolvePlan = new ResolveTenantSubscriptionPlan(tenantRepository, billingRepository);
	const resolveEffective = new ResolveTenantEffectivePlanFeatures(resolvePlan, tenantRepository);
	const assertFeature = new AssertTenantPlanFeature(resolveEffective);
	const assertEmployeeLimit = new AssertTenantEmployeeLimit(resolvePlan, membershipRepository);
	const listPromotions = new ListPromotions(tenantRepository, new InMemoryPromotionRepository(), assertFeature);

	return { assertFeature, assertEmployeeLimit, listPromotions, resolvePlan, resolveEffective, tenantRepository };
}

async function verifyFeatureGuards(): Promise<void> {
	const basicStack = buildStack(planBasic);

	await expectError("Basic tenant promotions feature", () =>
		basicStack.assertFeature.execute({ tenantId, feature: "promotions" }),
		PlanFeatureNotAvailable,
	);

	await basicStack.assertFeature.execute({ tenantId, feature: "stamps" });
	console.log("✅ Basic tenant allows stamps feature");

	const proStack = buildStack(planPro);
	await proStack.assertFeature.execute({ tenantId, feature: "promotions" });
	console.log("✅ Pro tenant allows promotions feature");

	const premiumStack = buildStack(planPremium);
	await premiumStack.assertFeature.execute({ tenantId, feature: "promotions" });
	const premiumResolved = await premiumStack.resolveEffective.execute(tenantId);

	if (!premiumResolved.effectiveFeatures.referrals) {
		console.error("❌ Premium plan should include referrals feature flag");
		process.exit(1);
	}

	console.log("✅ Premium tenant includes referrals feature flag");
}

async function verifyTenantOverrides(): Promise<void> {
	const basicWithPromo = buildStack(planBasic, [], { promotions: true });
	await basicWithPromo.assertFeature.execute({ tenantId, feature: "promotions" });
	console.log("✅ Basic tenant override enables promotions");

	const proWithoutPromo = buildStack(planPro, [], { promotions: false });
	await expectError("Pro tenant override disables promotions", () =>
		proWithoutPromo.assertFeature.execute({ tenantId, feature: "promotions" }),
		PlanFeatureNotAvailable,
	);
}

async function verifyEmployeeLimit(): Promise<void> {
	const basicStack = buildStack(planBasic, [employee(1), employee(2), employee(3)]);

	await expectError("Basic tenant employee limit", () =>
		basicStack.assertEmployeeLimit.execute(tenantId),
		TenantPlanLimitExceeded,
	);

	console.log("✅ Basic tenant blocks invite when employee limit reached");
}

async function verifyListPromotionsGuard(): Promise<void> {
	const basicStack = buildStack(planBasic);

	await expectError("ListPromotions on Basic tenant", () =>
		basicStack.listPromotions.execute({ tenantId, role: TenantRole.Owner }),
		PlanFeatureNotAvailable,
	);

	const premiumStack = buildStack(planPremium);
	const promotions = await premiumStack.listPromotions.execute({
		tenantId,
		role: TenantRole.Owner,
	});

	if (promotions.length !== 0) {
		console.error("❌ ListPromotions should return empty catalog when none exist", promotions);
		process.exit(1);
	}

	console.log("✅ ListPromotions allowed on Premium tenant (empty catalog)");
}

async function main(): Promise<void> {
	process.env.DISABLE_TENANT_PLAN_GATES = "0";

	await verifyFeatureGuards();
	await verifyTenantOverrides();
	await verifyEmployeeLimit();
	await verifyListPromotionsGuard();
	console.log("✅ verify:tenant-feature-flags-use-case passed");
}

void main();
