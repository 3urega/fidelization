/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { AssertTenantPlanFeature } from "../src/contexts/billing/subscriptions/application/guard/AssertTenantPlanFeature";
import { ResolveTenantSubscriptionPlan } from "../src/contexts/billing/subscriptions/application/resolve/ResolveTenantSubscriptionPlan";
import { PlanFeatureNotAvailable } from "../src/contexts/billing/subscriptions/domain/PlanFeatureNotAvailable";
import {
	BASIC_PLAN_FEATURES,
	PREMIUM_PLAN_FEATURES,
	PRO_PLAN_FEATURES,
} from "../src/contexts/billing/subscriptions/domain/SubscriptionPlanFeatures";
import { SubscriptionPlan } from "../src/contexts/billing/subscriptions/domain/SubscriptionPlan";
import { TenantBillingRepository } from "../src/contexts/billing/subscriptions/domain/TenantBillingRepository";
import { CreatePromotion } from "../src/contexts/loyalty/promotions/application/create/CreatePromotion";
import { ListPromotions } from "../src/contexts/loyalty/promotions/application/list/ListPromotions";
import { UpdatePromotion } from "../src/contexts/loyalty/promotions/application/update/UpdatePromotion";
import { InvalidPromotion } from "../src/contexts/loyalty/promotions/domain/InvalidPromotion";
import { Promotion } from "../src/contexts/loyalty/promotions/domain/Promotion";
import { PromotionForbidden } from "../src/contexts/loyalty/promotions/domain/PromotionForbidden";
import { PromotionNotFound } from "../src/contexts/loyalty/promotions/domain/PromotionNotFound";
import { PromotionRepository } from "../src/contexts/loyalty/promotions/domain/PromotionRepository";
import { TenantRole } from "../src/contexts/tenants/memberships/domain/TenantRole";
import { Tenant } from "../src/contexts/tenants/tenants/domain/Tenant";
import { TenantNotFound } from "../src/contexts/tenants/tenants/domain/TenantNotFound";
import { TenantRepository } from "../src/contexts/tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../src/contexts/tenants/tenants/domain/TenantStatus";

const tenantId = "00000000-0000-4000-8000-0000000000p1";
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

class InMemoryPromotionRepository extends PromotionRepository {
	private promotions = new Map<string, Promotion>();

	async save(promotion: Promotion): Promise<void> {
		this.promotions.set(promotion.id, promotion);
	}

	async searchById(tenantId: string, id: string): Promise<Promotion | null> {
		const promotion = this.promotions.get(id);

		return promotion && promotion.tenantId === tenantId ? promotion : null;
	}

	async listByTenant(tenantId: string): Promise<Promotion[]> {
		return Array.from(this.promotions.values()).filter(
			(promotion) => promotion.tenantId === tenantId,
		);
	}

	async listActiveByTenantAt(tenantId: string, at: Date): Promise<Promotion[]> {
		return Array.from(this.promotions.values()).filter((promotion) => {
			if (promotion.tenantId !== tenantId || !promotion.isActive) {
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
		name: "Promotions Verify Cafe",
		slug: "promotions-verify-cafe",
		logoUrl: "",
		primaryColor: "#7C3AED",
		secondaryColor: "#4F46E5",
		subscriptionPlan: planName,
		subscriptionPlanId: planId,
		status: TenantStatus.Active,
		createdAt: new Date().toISOString(),
	});
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

async function expectForbidden(label: string, action: () => Promise<unknown>): Promise<void> {
	await expectError(label, action, PromotionForbidden);
}

function buildStack(plan: SubscriptionPlan) {
	const tenantRepository = new MutableStubTenantRepository(baseTenant(plan.id, plan.name));
	const billingRepository = new InMemoryTenantBillingRepository([planBasic, planPro, planPremium]);
	const promotionRepository = new InMemoryPromotionRepository();
	const resolvePlan = new ResolveTenantSubscriptionPlan(tenantRepository, billingRepository);
	const assertFeature = new AssertTenantPlanFeature(resolvePlan);

	return {
		create: new CreatePromotion(tenantRepository, promotionRepository, assertFeature),
		list: new ListPromotions(tenantRepository, promotionRepository, assertFeature),
		update: new UpdatePromotion(tenantRepository, promotionRepository, assertFeature),
		promotionRepository,
	};
}

async function main(): Promise<void> {
	process.env.DISABLE_TENANT_PLAN_GATES = "0";

	const basicStack = buildStack(planBasic);

	await expectError(
		"ListPromotions Basic tenant",
		() => basicStack.list.execute({ tenantId, role: TenantRole.Owner }),
		PlanFeatureNotAvailable,
	);

	await expectError(
		"CreatePromotion Basic tenant",
		() =>
			basicStack.create.execute({
				tenantId,
				role: TenantRole.Owner,
				input: { title: "Promo", type: "discount" },
			}),
		PlanFeatureNotAvailable,
	);

	const proStack = buildStack(planPro);

	await expectForbidden("CreatePromotion employee", () =>
		proStack.create.execute({
			tenantId,
			role: TenantRole.Employee,
			input: { title: "Promo", type: "discount" },
		}),
	);

	const created = await proStack.create.execute({
		tenantId,
		role: TenantRole.Owner,
		input: {
			title: "2x1 cafés",
			description: "Válido entre semana",
			type: "bundle",
			maxUsesPerUser: 2,
		},
	});

	if (
		!created.isActive ||
		created.type !== "bundle" ||
		created.title !== "2x1 cafés" ||
		created.maxUsesPerUser !== 2
	) {
		console.error("❌ CreatePromotion owner", created.toPrimitives());
		process.exit(1);
	}

	console.log("✅ CreatePromotion owner");

	const employeeList = await proStack.list.execute({ tenantId, role: TenantRole.Employee });

	if (employeeList.length !== 1 || employeeList[0]?.id !== created.id) {
		console.error("❌ ListPromotions employee", employeeList);
		process.exit(1);
	}

	console.log("✅ ListPromotions employee");

	const ownerList = await proStack.list.execute({ tenantId, role: TenantRole.Owner });

	if (ownerList.length !== 1 || ownerList[0]?.id !== created.id) {
		console.error("❌ ListPromotions owner", ownerList);
		process.exit(1);
	}

	console.log("✅ ListPromotions owner");

	try {
		await proStack.create.execute({
			tenantId,
			role: TenantRole.Owner,
			input: { title: "", type: "discount" },
		});
		console.error("❌ expected InvalidPromotion for empty title");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof InvalidPromotion)) {
			console.error("❌ wrong error for empty title", error);
			process.exit(1);
		}
	}

	console.log("✅ empty title → InvalidPromotion");

	await expectForbidden("UpdatePromotion employee", () =>
		proStack.update.execute({
			tenantId,
			role: TenantRole.Employee,
			promotionId: created.id,
			input: { isActive: false },
		}),
	);

	try {
		await proStack.update.execute({
			tenantId,
			role: TenantRole.Owner,
			promotionId: "missing-id",
			input: { isActive: false },
		});
		console.error("❌ expected PromotionNotFound");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof PromotionNotFound)) {
			console.error("❌ wrong error for missing promotion", error);
			process.exit(1);
		}
	}

	console.log("✅ missing promotion → PromotionNotFound");

	const deactivated = await proStack.update.execute({
		tenantId,
		role: TenantRole.Owner,
		promotionId: created.id,
		input: { isActive: false },
	});

	if (deactivated.isActive) {
		console.error("❌ UpdatePromotion deactivate", deactivated.toPrimitives());
		process.exit(1);
	}

	console.log("✅ UpdatePromotion deactivate");

	const listedAfterDeactivate = await proStack.list.execute({
		tenantId,
		role: TenantRole.Owner,
	});

	if (
		listedAfterDeactivate.length !== 1 ||
		listedAfterDeactivate[0]?.id !== created.id ||
		listedAfterDeactivate[0]?.isActive
	) {
		console.error("❌ ListPromotions includes inactive promotion", listedAfterDeactivate);
		process.exit(1);
	}

	console.log("✅ ListPromotions includes inactive promotion");

	const missingTenantCreate = new CreatePromotion(
		new MutableStubTenantRepository(null),
		new InMemoryPromotionRepository(),
		new AssertTenantPlanFeature(
			new ResolveTenantSubscriptionPlan(
				new MutableStubTenantRepository(null),
				new InMemoryTenantBillingRepository([planBasic, planPro, planPremium]),
			),
		),
	);

	try {
		await missingTenantCreate.execute({
			tenantId,
			role: TenantRole.Owner,
			input: { title: "X", type: "discount" },
		});
		console.error("❌ expected TenantNotFound");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof TenantNotFound)) {
			console.error("❌ wrong error for missing tenant", error);
			process.exit(1);
		}
	}

	console.log("✅ missing tenant → TenantNotFound");
	console.log("✅ verify:promotions-use-case passed");
}

void main();
