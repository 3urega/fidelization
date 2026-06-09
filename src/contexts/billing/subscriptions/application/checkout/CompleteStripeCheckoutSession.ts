import { Service } from "diod";

import { SubscriptionPlanNotFound } from "../../domain/SubscriptionPlanNotFound";
import { TenantAlreadyHasActiveSubscription } from "../../domain/TenantAlreadyHasActiveSubscription";
import { TenantBillingRepository } from "../../domain/TenantBillingRepository";
import { TenantSubscription } from "../../domain/TenantSubscription";

export type CompleteStripeCheckoutSessionParams = {
	tenantId: string;
	planId: string;
	stripeSubscriptionId: string;
	stripeSessionId: string;
};

export type CompleteStripeCheckoutSessionResult = {
	subscription: TenantSubscription;
	created: boolean;
};

@Service()
export class CompleteStripeCheckoutSession {
	constructor(private readonly billingRepository: TenantBillingRepository) {}

	async execute(
		params: CompleteStripeCheckoutSessionParams,
	): Promise<CompleteStripeCheckoutSessionResult> {
		const tenantId = params.tenantId.trim();
		const planId = params.planId.trim();
		const stripeSubscriptionId = params.stripeSubscriptionId.trim();

		if (!tenantId || !planId || !stripeSubscriptionId) {
			throw new Error("tenantId, planId and stripeSubscriptionId are required");
		}

		const existingByStripe = await this.billingRepository.searchSubscriptionByStripeId(
			stripeSubscriptionId,
		);
		if (existingByStripe) {
			return { subscription: existingByStripe, created: false };
		}

		const activeSubscription = await this.billingRepository.searchActiveSubscription(tenantId);
		if (activeSubscription) {
			throw new TenantAlreadyHasActiveSubscription(tenantId);
		}

		const plan = await this.billingRepository.searchPlanById(planId);
		if (!plan || !plan.isActive) {
			throw new SubscriptionPlanNotFound(planId);
		}

		const subscription = TenantSubscription.createFromStripeCheckout({
			tenantId,
			planId,
			stripeSubscriptionId,
		});

		await this.billingRepository.saveSubscription(subscription);
		await this.billingRepository.linkTenantPlan(tenantId, planId);

		return { subscription, created: true };
	}
}
