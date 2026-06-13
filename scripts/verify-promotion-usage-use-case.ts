/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { AssertTenantPlanFeature } from "../src/contexts/billing/subscriptions/application/guard/AssertTenantPlanFeature";
import { ResolveTenantSubscriptionPlan } from "../src/contexts/billing/subscriptions/application/resolve/ResolveTenantSubscriptionPlan";
import {
	BASIC_PLAN_FEATURES,
	PRO_PLAN_FEATURES,
} from "../src/contexts/billing/subscriptions/domain/SubscriptionPlanFeatures";
import { SubscriptionPlan } from "../src/contexts/billing/subscriptions/domain/SubscriptionPlan";
import { TenantBillingRepository } from "../src/contexts/billing/subscriptions/domain/TenantBillingRepository";
import { User } from "../src/contexts/identity/users/domain/User";
import { UserRepository } from "../src/contexts/identity/users/domain/UserRepository";
import { RecordPromotionUse } from "../src/contexts/loyalty/customers/application/promotions/RecordPromotionUse";
import { ListCustomerPromotionSummaries } from "../src/contexts/loyalty/promotions/application/list/ListCustomerPromotionSummaries";
import { Customer } from "../src/contexts/loyalty/customers/domain/Customer";
import { CustomerRepository } from "../src/contexts/loyalty/customers/domain/CustomerRepository";
import { LoyaltyTransaction } from "../src/contexts/loyalty/loyalty_transactions/domain/LoyaltyTransaction";
import { LoyaltyTransactionRepository } from "../src/contexts/loyalty/loyalty_transactions/domain/LoyaltyTransactionRepository";
import { CustomerPromotionUsage } from "../src/contexts/loyalty/promotions/domain/CustomerPromotionUsage";
import { CustomerPromotionUsageRepository } from "../src/contexts/loyalty/promotions/domain/CustomerPromotionUsageRepository";
import { Promotion } from "../src/contexts/loyalty/promotions/domain/Promotion";
import { PromotionRepository } from "../src/contexts/loyalty/promotions/domain/PromotionRepository";
import { PromotionUsageLimitReached } from "../src/contexts/loyalty/promotions/domain/PromotionUsageLimitReached";
import { TenantRole } from "../src/contexts/tenants/memberships/domain/TenantRole";
import { Tenant } from "../src/contexts/tenants/tenants/domain/Tenant";
import { TenantRepository } from "../src/contexts/tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../src/contexts/tenants/tenants/domain/TenantStatus";

const tenantId = "00000000-0000-4000-8000-0000000000u1";
const customerId = "00000000-0000-4000-8000-0000000000u2";
const userId = "00000000-0000-4000-8000-0000000000u3";
const staffUserId = "00000000-0000-4000-8000-0000000000u4";
const planProId = "00000000-0000-4000-8000-000000000006";
const qrValue = "verify-promo-use-qr";

const planPro = SubscriptionPlan.fromPrimitives({
	id: planProId,
	name: "pro",
	priceMonthly: 2900,
	priceYearly: 29000,
	features: PRO_PLAN_FEATURES,
	limits: { employees: 10 },
	isActive: true,
});

const planBasic = SubscriptionPlan.fromPrimitives({
	id: "00000000-0000-4000-8000-000000000004",
	name: "basic",
	priceMonthly: 0,
	priceYearly: 0,
	features: BASIC_PLAN_FEATURES,
	limits: { employees: 3 },
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

class InMemoryCustomerPromotionUsageRepository extends CustomerPromotionUsageRepository {
	private usages = new Map<string, CustomerPromotionUsage>();

	private key(customerId: string, promotionId: string): string {
		return `${customerId}:${promotionId}`;
	}

	async searchUsage(
		tenantId: string,
		customerId: string,
		promotionId: string,
	): Promise<CustomerPromotionUsage | null> {
		const usage = this.usages.get(this.key(customerId, promotionId));

		return usage && usage.tenantId === tenantId ? usage : null;
	}

	async saveUsage(usage: CustomerPromotionUsage): Promise<void> {
		const p = usage.toPrimitives();
		this.usages.set(this.key(p.customerId, p.promotionId), usage);
	}
}

class InMemoryCustomerRepository extends CustomerRepository {
	constructor(private readonly customer: Customer) {
		super();
	}

	async save(): Promise<void> {}

	async searchById(): Promise<Customer | null> {
		return null;
	}

	async searchByQrValue(tenantId: string, value: string): Promise<Customer | null> {
		return tenantId === this.customer.tenantId && value === this.customer.qrValue
			? this.customer
			: null;
	}

	async searchByUserIdAndTenantId(userIdParam: string, tenantId: string): Promise<Customer | null> {
		return userIdParam === this.customer.userId && tenantId === this.customer.tenantId
			? this.customer
			: null;
	}

	async listWithInteractionByUserId(): Promise<never[]> {
		return [];
	}
}

class InMemoryUserRepository extends UserRepository {
	constructor(private readonly user: User) {
		super();
	}

	async save(): Promise<void> {}

	async search(): Promise<User | null> {
		return null;
	}

	async searchByEmail(): Promise<null> {
		return null;
	}

	async searchByQrValue(value: string): Promise<User | null> {
		return value === this.user.qrValue ? this.user : null;
	}

	async searchByOAuthSubject(): Promise<null> {
		return null;
	}

	async updatePasswordHash(): Promise<void> {}

	async isPlatformSuperadmin(): Promise<boolean> {
		return false;
	}
}

class InMemoryLoyaltyTransactionRepository extends LoyaltyTransactionRepository {
	readonly saved: LoyaltyTransaction[] = [];

	async save(transaction: LoyaltyTransaction): Promise<void> {
		this.saved.push(transaction);
	}

	async searchById(): Promise<LoyaltyTransaction | null> {
		return null;
	}
}

function baseTenant(): Tenant {
	return Tenant.fromPrimitives({
		id: tenantId,
		name: "Promotion Usage Verify Cafe",
		slug: "promotion-usage-verify-cafe",
		logoUrl: "",
		primaryColor: "#7C3AED",
		secondaryColor: "#4F46E5",
		subscriptionPlan: "pro",
		subscriptionPlanId: planProId,
		status: TenantStatus.Active,
		createdAt: new Date().toISOString(),
	});
}

function limitedPromotion(id: string): Promotion {
	return Promotion.fromPrimitives({
		id,
		tenantId,
		title: "2x1 verify",
		description: "Limited promo",
		type: "discount",
		startDate: null,
		endDate: null,
		isActive: true,
		maxUsesPerUser: 2,
	});
}

function buildStack(promotion: Promotion) {
	const tenantRepository = new MutableStubTenantRepository(baseTenant());
	const billingRepository = new InMemoryTenantBillingRepository([planBasic, planPro]);
	const resolvePlan = new ResolveTenantSubscriptionPlan(tenantRepository, billingRepository);
	const assertFeature = new AssertTenantPlanFeature(resolvePlan);
	const promotionRepository = new InMemoryPromotionRepository([promotion]);
	const usageRepository = new InMemoryCustomerPromotionUsageRepository();
	const customer = Customer.fromPrimitives({
		id: customerId,
		tenantId,
		userId,
		name: "Usage Customer",
		email: "usage@example.local",
		qrValue,
		pointsBalance: 0,
		visitsCount: 0,
		createdAt: new Date().toISOString(),
	});
	const customerRepository = new InMemoryCustomerRepository(customer);
	const user = User.create(userId, "Usage Customer", "usage@example.local", "", qrValue);
	const userRepository = new InMemoryUserRepository(user);
	const loyaltyTransactionRepository = new InMemoryLoyaltyTransactionRepository();

	return {
		recordUse: new RecordPromotionUse(
			tenantRepository,
			customerRepository,
			userRepository,
			promotionRepository,
			usageRepository,
			loyaltyTransactionRepository,
			assertFeature,
		),
		listSummaries: new ListCustomerPromotionSummaries(
			tenantRepository,
			promotionRepository,
			usageRepository,
			resolvePlan,
		),
		loyaltyTransactionRepository,
		promotion,
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

async function main(): Promise<void> {
	process.env.DISABLE_TENANT_PLAN_GATES = "0";

	const promotionId = "promo-limited-1";
	const stack = buildStack(limitedPromotion(promotionId));

	const first = await stack.recordUse.execute({
		tenantId,
		promotionId,
		qrValue,
		createdByUserId: staffUserId,
		staffRole: TenantRole.Owner,
	});

	if (first.summary.usedCount !== 1 || first.summary.maxUsesPerUser !== 2) {
		console.error("❌ first use summary", first.summary);
		process.exit(1);
	}

	console.log("✅ first use → usedCount 1");

	const second = await stack.recordUse.execute({
		tenantId,
		promotionId,
		qrValue,
		createdByUserId: staffUserId,
		staffRole: TenantRole.Employee,
	});

	if (second.summary.usedCount !== 2) {
		console.error("❌ second use summary", second.summary);
		process.exit(1);
	}

	console.log("✅ second use → usedCount 2");

	await expectError(
		"third use exceeds limit",
		() =>
			stack.recordUse.execute({
				tenantId,
				promotionId,
				qrValue,
				createdByUserId: staffUserId,
				staffRole: TenantRole.Owner,
			}),
		PromotionUsageLimitReached,
	);

	const summaries = await stack.listSummaries.execute({ tenantId, customerId });

	if (
		summaries.length !== 1 ||
		summaries[0]?.usedCount !== 2 ||
		summaries[0]?.maxUsesPerUser !== 2
	) {
		console.error("❌ list summaries with usage", summaries);
		process.exit(1);
	}

	console.log("✅ ListCustomerPromotionSummaries → usedCount 2");

	const withoutCustomer = await stack.listSummaries.execute({ tenantId });

	if (withoutCustomer.length !== 1 || withoutCustomer[0]?.usedCount !== 0) {
		console.error("❌ summaries without customerId", withoutCustomer);
		process.exit(1);
	}

	console.log("✅ summaries without customerId → usedCount 0");

	const tx = stack.loyaltyTransactionRepository.saved.filter(
		(row) => row.toPrimitives().type === "promotion_used",
	);

	if (tx.length !== 2) {
		console.error("❌ expected 2 promotion_used transactions", tx.length);
		process.exit(1);
	}

	console.log("✅ loyalty_transactions promotion_used audit rows");
	console.log("✅ verify:promotion-usage-use-case passed");
}

void main();
