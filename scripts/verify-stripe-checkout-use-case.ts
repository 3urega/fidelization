/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { CreateStripeCheckoutSession } from "../src/contexts/billing/subscriptions/application/checkout/CreateStripeCheckoutSession";
import { FreePlanDoesNotRequireCheckout } from "../src/contexts/billing/subscriptions/domain/FreePlanDoesNotRequireCheckout";
import {
	BASIC_PLAN_FEATURES,
	PRO_PLAN_FEATURES,
} from "../src/contexts/billing/subscriptions/domain/SubscriptionPlanFeatures";
import { SubscriptionPlan } from "../src/contexts/billing/subscriptions/domain/SubscriptionPlan";
import { SubscriptionPlanNotFound } from "../src/contexts/billing/subscriptions/domain/SubscriptionPlanNotFound";
import { TenantAlreadyHasActiveSubscription } from "../src/contexts/billing/subscriptions/domain/TenantAlreadyHasActiveSubscription";
import { TenantBillingForbidden } from "../src/contexts/billing/subscriptions/domain/TenantBillingForbidden";
import { TenantBillingRepository } from "../src/contexts/billing/subscriptions/domain/TenantBillingRepository";
import { TenantSubscription } from "../src/contexts/billing/subscriptions/domain/TenantSubscription";
import {
	CreateStripeCheckoutSessionParams,
	CreateStripeCheckoutSessionResult,
	StripeCheckoutGateway,
} from "../src/contexts/billing/stripe/domain/StripeCheckoutGateway";
import { TenantRole } from "../src/contexts/tenants/memberships/domain/TenantRole";
import { TenantAccessSuspended } from "../src/contexts/tenants/tenants/domain/TenantAccessSuspended";
import { Tenant } from "../src/contexts/tenants/tenants/domain/Tenant";
import { TenantNotFound } from "../src/contexts/tenants/tenants/domain/TenantNotFound";
import { TenantRepository } from "../src/contexts/tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../src/contexts/tenants/tenants/domain/TenantStatus";

const tenantId = "00000000-0000-4000-8000-0000000000s1";
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
	constructor(
		private readonly plans: SubscriptionPlan[],
		private readonly activeSubscription: TenantSubscription | null = null,
	) {
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

	async searchActiveSubscription(): Promise<TenantSubscription | null> {
		return this.activeSubscription;
	}

	async searchSubscriptionByStripeId(): Promise<TenantSubscription | null> {
		return null;
	}

	async linkTenantPlan(): Promise<void> {}
}

class StubStripeCheckoutGateway extends StripeCheckoutGateway {
	async createCheckoutSession(
		params: CreateStripeCheckoutSessionParams,
	): Promise<CreateStripeCheckoutSessionResult> {
		return {
			checkoutUrl: `https://checkout.stripe.test/session/${params.planId}`,
			sessionId: `cs_test_${params.tenantId}`,
		};
	}
}

function baseTenant(status: TenantStatus = TenantStatus.Active): Tenant {
	return Tenant.fromPrimitives({
		id: tenantId,
		name: "Stripe Checkout Verify Cafe",
		slug: "stripe-checkout-verify",
		logoUrl: "",
		primaryColor: "#7C3AED",
		secondaryColor: "#4F46E5",
		subscriptionPlan: "basic",
		subscriptionPlanId: null,
		status,
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

async function verifyCheckoutStub(): Promise<void> {
	process.env.STRIPE_PRICE_PRO_MONTHLY = "price_test_pro_monthly";

	const tenantRepository = new MutableStubTenantRepository(baseTenant());
	const billingRepository = new InMemoryTenantBillingRepository([planBasic, planPro]);
	const checkout = new CreateStripeCheckoutSession(
		tenantRepository,
		billingRepository,
		new StubStripeCheckoutGateway(),
	);

	await expectError("CreateStripeCheckoutSession employee", () =>
		checkout.execute({
			tenantId,
			role: TenantRole.Employee,
			planId: planProId,
			ownerEmail: "owner@example.com",
			successUrl: "http://localhost:3000/home?checkout=success",
			cancelUrl: "http://localhost:3000/onboarding/plan?checkout=cancel",
		}),
		TenantBillingForbidden,
	);

	await expectError("CreateStripeCheckoutSession basic plan", () =>
		checkout.execute({
			tenantId,
			role: TenantRole.Owner,
			planId: planBasicId,
			ownerEmail: "owner@example.com",
			successUrl: "http://localhost:3000/home?checkout=success",
			cancelUrl: "http://localhost:3000/onboarding/plan?checkout=cancel",
		}),
		FreePlanDoesNotRequireCheckout,
	);

	await expectError("CreateStripeCheckoutSession missing plan", () =>
		checkout.execute({
			tenantId,
			role: TenantRole.Owner,
			planId: "missing-plan",
			ownerEmail: "owner@example.com",
			successUrl: "http://localhost:3000/home?checkout=success",
			cancelUrl: "http://localhost:3000/onboarding/plan?checkout=cancel",
		}),
		SubscriptionPlanNotFound,
	);

	const activeSubscription = TenantSubscription.fromPrimitives({
		id: "00000000-0000-4000-8000-0000000000sub",
		tenantId,
		planId: planProId,
		status: "active",
		stripeSubscriptionId: "sub_existing",
	});
	const billingWithSubscription = new InMemoryTenantBillingRepository(
		[planBasic, planPro],
		activeSubscription,
	);
	const checkoutWithSubscription = new CreateStripeCheckoutSession(
		tenantRepository,
		billingWithSubscription,
		new StubStripeCheckoutGateway(),
	);

	await expectError("CreateStripeCheckoutSession active subscription", () =>
		checkoutWithSubscription.execute({
			tenantId,
			role: TenantRole.Owner,
			planId: planProId,
			ownerEmail: "owner@example.com",
			successUrl: "http://localhost:3000/home?checkout=success",
			cancelUrl: "http://localhost:3000/onboarding/plan?checkout=cancel",
		}),
		TenantAlreadyHasActiveSubscription,
	);

	const suspendedCheckout = new CreateStripeCheckoutSession(
		new MutableStubTenantRepository(baseTenant(TenantStatus.Suspended)),
		billingRepository,
		new StubStripeCheckoutGateway(),
	);

	await expectError("CreateStripeCheckoutSession suspended tenant", () =>
		suspendedCheckout.execute({
			tenantId,
			role: TenantRole.Owner,
			planId: planProId,
			ownerEmail: "owner@example.com",
			successUrl: "http://localhost:3000/home?checkout=success",
			cancelUrl: "http://localhost:3000/onboarding/plan?checkout=cancel",
		}),
		TenantAccessSuspended,
	);

	const missingTenantCheckout = new CreateStripeCheckoutSession(
		new MutableStubTenantRepository(null),
		billingRepository,
		new StubStripeCheckoutGateway(),
	);

	await expectError("CreateStripeCheckoutSession missing tenant", () =>
		missingTenantCheckout.execute({
			tenantId,
			role: TenantRole.Owner,
			planId: planProId,
			ownerEmail: "owner@example.com",
			successUrl: "http://localhost:3000/home?checkout=success",
			cancelUrl: "http://localhost:3000/onboarding/plan?checkout=cancel",
		}),
		TenantNotFound,
	);

	const result = await checkout.execute({
		tenantId,
		role: TenantRole.Owner,
		planId: planProId,
		ownerEmail: "owner@example.com",
		successUrl: "http://localhost:3000/home?checkout=success",
		cancelUrl: "http://localhost:3000/onboarding/plan?checkout=cancel",
	});

	if (!result.checkoutUrl.includes(planProId) || !result.sessionId.startsWith("cs_test_")) {
		console.error("❌ CreateStripeCheckoutSession owner pro", result);
		process.exit(1);
	}

	console.log("✅ CreateStripeCheckoutSession owner pro returns checkout URL");
	console.log("✅ verify:stripe-checkout-use-case passed");
}

void verifyCheckoutStub();
