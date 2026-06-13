/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { AssertTenantPlanFeature } from "../src/contexts/billing/subscriptions/application/guard/AssertTenantPlanFeature";
import { ResolveTenantSubscriptionPlan } from "../src/contexts/billing/subscriptions/application/resolve/ResolveTenantSubscriptionPlan";
import { ListPlatformSubscriptionPlans } from "../src/contexts/billing/subscriptions/application/list/ListPlatformSubscriptionPlans";
import { UpdateSubscriptionPlan } from "../src/contexts/billing/subscriptions/application/update/UpdateSubscriptionPlan";
import {
	BASIC_PLAN_FEATURES,
	PRO_PLAN_FEATURES,
} from "../src/contexts/billing/subscriptions/domain/SubscriptionPlanFeatures";
import { SubscriptionPlan } from "../src/contexts/billing/subscriptions/domain/SubscriptionPlan";
import { SubscriptionPlanNotFound } from "../src/contexts/billing/subscriptions/domain/SubscriptionPlanNotFound";
import { TenantBillingRepository } from "../src/contexts/billing/subscriptions/domain/TenantBillingRepository";
import { TenantSubscription } from "../src/contexts/billing/subscriptions/domain/TenantSubscription";
import { Tenant } from "../src/contexts/tenants/tenants/domain/Tenant";
import { TenantRepository } from "../src/contexts/tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../src/contexts/tenants/tenants/domain/TenantStatus";

const tenantId = "00000000-0000-4000-8000-0000000000p1";
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
	private plans: SubscriptionPlan[];

	constructor(initial: SubscriptionPlan[]) {
		super();
		this.plans = [...initial];
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

	async searchActiveSubscription(): Promise<TenantSubscription | null> {
		return null;
	}

	async searchSubscriptionByStripeId(): Promise<TenantSubscription | null> {
		return null;
	}

	async updateSubscriptionStatus(): Promise<void> {}

	async linkTenantPlan(): Promise<void> {}
}

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
		return this.tenant;
	}

	async updateBranding(): Promise<Tenant | null> {
		return this.tenant;
	}
}

async function main(): Promise<void> {
	const billingRepository = new MutableBillingRepository([planBasic, planPro]);
	const listUseCase = new ListPlatformSubscriptionPlans(billingRepository);
	const updateUseCase = new UpdateSubscriptionPlan(billingRepository);

	const listed = await listUseCase.execute();

	if (listed.length !== 2 || listed[0]?.name !== "basic") {
		console.error("❌ ListPlatformSubscriptionPlans", listed);
		process.exit(1);
	}

	console.log("✅ ListPlatformSubscriptionPlans returns catalog");

	const updated = await updateUseCase.execute({
		planId: planProId,
		features: {
			...PRO_PLAN_FEATURES,
			gamification: true,
		},
	});

	if (!updated.toPrimitives().features.gamification) {
		console.error("❌ UpdateSubscriptionPlan did not persist gamification", updated.toPrimitives());
		process.exit(1);
	}

	console.log("✅ UpdateSubscriptionPlan persists features");

	const tenant = Tenant.fromPrimitives({
		id: tenantId,
		name: "Cafe Pro",
		slug: "cafe-pro-plans",
		logoUrl: "",
		primaryColor: "#7C3AED",
		secondaryColor: "#4F46E5",
		subscriptionPlan: "pro",
		subscriptionPlanId: planProId,
		status: TenantStatus.Active,
		createdAt: "2026-06-01T10:00:00.000Z",
	});

	const resolvePlan = new ResolveTenantSubscriptionPlan(
		new StubTenantRepository(tenant),
		billingRepository,
	);
	const assertFeature = new AssertTenantPlanFeature(resolvePlan);

	await assertFeature.execute({ tenantId, feature: "gamification" });

	console.log("✅ AssertTenantPlanFeature reads updated catalog features");

	try {
		await updateUseCase.execute({ planId: "missing-plan-id", features: PRO_PLAN_FEATURES });
		console.error("❌ expected SubscriptionPlanNotFound");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof SubscriptionPlanNotFound)) {
			console.error("❌ unexpected error", error);
			process.exit(1);
		}
	}

	console.log("✅ missing plan → SubscriptionPlanNotFound");
	console.log("✅ verify:platform-admin-plans-use-case passed");
}

void main();
