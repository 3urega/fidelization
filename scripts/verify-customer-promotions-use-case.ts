/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { ResolveTenantSubscriptionPlan } from "../src/contexts/billing/subscriptions/application/resolve/ResolveTenantSubscriptionPlan";
import {
	BASIC_PLAN_FEATURES,
	PRO_PLAN_FEATURES,
} from "../src/contexts/billing/subscriptions/domain/SubscriptionPlanFeatures";
import { SubscriptionPlan } from "../src/contexts/billing/subscriptions/domain/SubscriptionPlan";
import { TenantBillingRepository } from "../src/contexts/billing/subscriptions/domain/TenantBillingRepository";
import { ListActivePromotionsForCustomer } from "../src/contexts/loyalty/promotions/application/list/ListActivePromotionsForCustomer";
import { Promotion } from "../src/contexts/loyalty/promotions/domain/Promotion";
import { PromotionRepository } from "../src/contexts/loyalty/promotions/domain/PromotionRepository";
import { TenantAccessSuspended } from "../src/contexts/tenants/tenants/domain/TenantAccessSuspended";
import { Tenant } from "../src/contexts/tenants/tenants/domain/Tenant";
import { TenantNotFound } from "../src/contexts/tenants/tenants/domain/TenantNotFound";
import { TenantRepository } from "../src/contexts/tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../src/contexts/tenants/tenants/domain/TenantStatus";

const tenantId = "00000000-0000-4000-8000-0000000000p2";
const planBasicId = "00000000-0000-4000-8000-000000000004";
const planProId = "00000000-0000-4000-8000-000000000006";
const fixedAt = new Date("2026-06-15T12:00:00.000Z");

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

class InMemoryPromotionRepository extends PromotionRepository {
	constructor(private readonly promotions: Promotion[] = []) {
		super();
	}

	async save(promotion: Promotion): Promise<void> {
		const index = this.promotions.findIndex((item) => item.id === promotion.id);
		if (index >= 0) {
			this.promotions[index] = promotion;
		} else {
			this.promotions.push(promotion);
		}
	}

	async searchById(tenantId: string, id: string): Promise<Promotion | null> {
		return (
			this.promotions.find((promotion) => promotion.id === id && promotion.tenantId === tenantId) ??
			null
		);
	}

	async listByTenant(tenantId: string): Promise<Promotion[]> {
		return this.promotions.filter((promotion) => promotion.tenantId === tenantId);
	}

	async listActiveByTenantAt(tenantId: string, at: Date): Promise<Promotion[]> {
		return this.promotions.filter((promotion) => {
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

function baseTenant(planId: string, planName: string, status = TenantStatus.Active): Tenant {
	return Tenant.fromPrimitives({
		id: tenantId,
		name: "Customer Promotions Verify Cafe",
		slug: "customer-promotions-verify-cafe",
		logoUrl: "",
		primaryColor: "#7C3AED",
		secondaryColor: "#4F46E5",
		subscriptionPlan: planName,
		subscriptionPlanId: planId,
		status,
		createdAt: new Date().toISOString(),
	});
}

function promotionFixture(overrides: {
	id: string;
	isActive?: boolean;
	startDate?: string | null;
	endDate?: string | null;
}): Promotion {
	return Promotion.fromPrimitives({
		id: overrides.id,
		tenantId,
		title: `Promo ${overrides.id}`,
		description: "Verify customer promo",
		type: "discount",
		startDate: overrides.startDate ?? null,
		endDate: overrides.endDate ?? null,
		isActive: overrides.isActive ?? true,
	});
}

function buildUseCase(
	tenant: Tenant | null,
	promotions: Promotion[] = [],
): ListActivePromotionsForCustomer {
	const tenantRepository = new MutableStubTenantRepository(tenant);
	const billingRepository = new InMemoryTenantBillingRepository([planBasic, planPro]);
	const resolvePlan = new ResolveTenantSubscriptionPlan(tenantRepository, billingRepository);

	return new ListActivePromotionsForCustomer(
		tenantRepository,
		new InMemoryPromotionRepository(promotions),
		resolvePlan,
	);
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
			console.error(`❌ wrong error for ${label}:`, error);
			process.exit(1);
		}
	}

	console.log(`✅ ${label} → ${Expected.name}`);
}

async function main(): Promise<void> {
	const basicResult = await buildUseCase(baseTenant(planBasicId, "basic"), [
		promotionFixture({ id: "ignored-on-basic" }),
	]).execute({ tenantId });
	if (basicResult.length !== 0) {
		console.error("❌ Basic tenant should return empty promotions");
		process.exit(1);
	}
	console.log("✅ Basic tenant → promotions: []");

	const proPromotions = [
		promotionFixture({ id: "active-promo" }),
		promotionFixture({ id: "inactive-promo", isActive: false }),
		promotionFixture({
			id: "future-promo",
			startDate: "2026-07-01T00:00:00.000Z",
		}),
		promotionFixture({
			id: "expired-promo",
			endDate: "2026-06-01T00:00:00.000Z",
		}),
	];

	const proResults = await new InMemoryPromotionRepository(proPromotions).listActiveByTenantAt(
		tenantId,
		fixedAt,
	);
	if (proResults.length !== 1 || proResults[0]?.id !== "active-promo") {
		console.error("❌ repo filter should return only active in-range promo", proResults);
		process.exit(1);
	}
	console.log("✅ repo filter → active in-range promo only");

	const originalDate = Date;
	global.Date = class extends Date {
		constructor(...args: ConstructorParameters<typeof Date>) {
			if (args.length === 0) {
				super(fixedAt.toISOString());

				return;
			}

			super(...args);
		}

		static now(): number {
			return fixedAt.getTime();
		}
	} as DateConstructor;

	const useCaseResults = await buildUseCase(baseTenant(planProId, "pro"), proPromotions).execute({
		tenantId,
	});
	global.Date = originalDate;

	if (useCaseResults.length !== 1 || useCaseResults[0]?.id !== "active-promo") {
		console.error("❌ Pro tenant should return only active in-range promo", useCaseResults);
		process.exit(1);
	}
	console.log("✅ Pro tenant → active in-range promo only");

	await expectError(
		"missing tenant",
		() => buildUseCase(null).execute({ tenantId }),
		TenantNotFound,
	);

	await expectError(
		"suspended tenant",
		() =>
			buildUseCase(
				baseTenant(planProId, "pro", TenantStatus.Suspended),
				[promotionFixture({ id: "suspended-promo" })],
			).execute({ tenantId }),
		TenantAccessSuspended,
	);

	console.log("✅ verify:customer-promotions-use-case passed");
}

void main();
