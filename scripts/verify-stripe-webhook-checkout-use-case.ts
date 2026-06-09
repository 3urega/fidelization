/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { CompleteStripeCheckoutSession } from "../src/contexts/billing/subscriptions/application/checkout/CompleteStripeCheckoutSession";
import {
	PRO_PLAN_FEATURES,
} from "../src/contexts/billing/subscriptions/domain/SubscriptionPlanFeatures";
import { SubscriptionPlan } from "../src/contexts/billing/subscriptions/domain/SubscriptionPlan";
import { SubscriptionPlanNotFound } from "../src/contexts/billing/subscriptions/domain/SubscriptionPlanNotFound";
import { TenantAlreadyHasActiveSubscription } from "../src/contexts/billing/subscriptions/domain/TenantAlreadyHasActiveSubscription";
import { TenantBillingRepository } from "../src/contexts/billing/subscriptions/domain/TenantBillingRepository";
import { TenantSubscription } from "../src/contexts/billing/subscriptions/domain/TenantSubscription";

const tenantId = "00000000-0000-4000-8000-0000000000w1";
const planProId = "00000000-0000-4000-8000-000000000006";
const stripeSubscriptionId = "sub_test_complete_checkout";

const planPro = SubscriptionPlan.fromPrimitives({
	id: planProId,
	name: "pro",
	priceMonthly: 2900,
	priceYearly: 29000,
	features: PRO_PLAN_FEATURES,
	limits: { employees: 10 },
	isActive: true,
});

class InMemoryTenantBillingRepository extends TenantBillingRepository {
	private subscriptions: TenantSubscription[] = [];
	private linkedPlans = new Map<string, string>();

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

	async saveSubscription(subscription: TenantSubscription): Promise<void> {
		this.subscriptions.push(subscription);
	}

	async searchActiveSubscription(tenantIdParam: string): Promise<TenantSubscription | null> {
		return (
			this.subscriptions.find(
				(subscription) =>
					subscription.tenantId === tenantIdParam && subscription.status === "active",
			) ?? null
		);
	}

	async searchSubscriptionByStripeId(
		stripeSubscriptionIdParam: string,
	): Promise<TenantSubscription | null> {
		return (
			this.subscriptions.find(
				(subscription) => subscription.stripeSubscriptionId === stripeSubscriptionIdParam,
			) ?? null
		);
	}

	async linkTenantPlan(tenantIdParam: string, planId: string): Promise<void> {
		this.linkedPlans.set(tenantIdParam, planId);
	}

	getLinkedPlan(tenantIdParam: string): string | undefined {
		return this.linkedPlans.get(tenantIdParam);
	}
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

async function verifyCompleteCheckoutStub(): Promise<void> {
	const billingRepository = new InMemoryTenantBillingRepository([planPro]);
	const complete = new CompleteStripeCheckoutSession(billingRepository);

	await expectError("CompleteStripeCheckoutSession missing plan", () =>
		complete.execute({
			tenantId,
			planId: "missing-plan",
			stripeSubscriptionId,
			stripeSessionId: "cs_test_session",
		}),
		SubscriptionPlanNotFound,
	);

	const first = await complete.execute({
		tenantId,
		planId: planProId,
		stripeSubscriptionId,
		stripeSessionId: "cs_test_session",
	});

	if (
		!first.created ||
		first.subscription.stripeSubscriptionId !== stripeSubscriptionId ||
		billingRepository.getLinkedPlan(tenantId) !== planProId
	) {
		console.error("❌ CompleteStripeCheckoutSession first run", first);
		process.exit(1);
	}

	console.log("✅ CompleteStripeCheckoutSession creates subscription and links tenant plan");

	const second = await complete.execute({
		tenantId,
		planId: planProId,
		stripeSubscriptionId,
		stripeSessionId: "cs_test_session",
	});

	if (second.created || second.subscription.id !== first.subscription.id) {
		console.error("❌ CompleteStripeCheckoutSession idempotent replay", second);
		process.exit(1);
	}

	console.log("✅ CompleteStripeCheckoutSession is idempotent by stripeSubscriptionId");

	const otherStripeId = "sub_test_other";
	const billingWithActive = new InMemoryTenantBillingRepository([planPro]);
	await billingWithActive.saveSubscription(
		TenantSubscription.createFromStripeCheckout({
			tenantId,
			planId: planProId,
			stripeSubscriptionId: "sub_already_active",
		}),
	);
	const completeWithActive = new CompleteStripeCheckoutSession(billingWithActive);

	await expectError("CompleteStripeCheckoutSession tenant already subscribed", () =>
		completeWithActive.execute({
			tenantId,
			planId: planProId,
			stripeSubscriptionId: otherStripeId,
			stripeSessionId: "cs_test_session_2",
		}),
		TenantAlreadyHasActiveSubscription,
	);

	console.log("✅ verify:stripe-webhook-checkout-use-case passed");
}

void verifyCompleteCheckoutStub();
