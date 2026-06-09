import { SubscriptionPlan } from "./SubscriptionPlan";
import { TenantSubscription } from "./TenantSubscription";

export abstract class TenantBillingRepository {
	abstract savePlan(plan: SubscriptionPlan): Promise<void>;

	abstract searchPlanByName(name: string): Promise<SubscriptionPlan | null>;

	abstract searchPlanById(planId: string): Promise<SubscriptionPlan | null>;

	abstract listActivePlans(): Promise<SubscriptionPlan[]>;

	abstract saveSubscription(subscription: TenantSubscription): Promise<void>;

	abstract searchActiveSubscription(tenantId: string): Promise<TenantSubscription | null>;

	abstract searchSubscriptionByStripeId(
		stripeSubscriptionId: string,
	): Promise<TenantSubscription | null>;

	abstract updateSubscriptionStatus(
		subscriptionId: string,
		status: SubscriptionStatus,
	): Promise<void>;

	abstract linkTenantPlan(tenantId: string, planId: string): Promise<void>;
}
