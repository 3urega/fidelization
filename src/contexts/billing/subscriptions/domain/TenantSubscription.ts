import { randomUUID } from "crypto";

export type SubscriptionStatus = "active" | "past_due" | "canceled";

export type TenantSubscriptionPrimitives = {
	id: string;
	tenantId: string;
	planId: string;
	status: SubscriptionStatus;
	stripeSubscriptionId: string | null;
};

export class TenantSubscription {
	private constructor(
		public readonly id: string,
		public readonly tenantId: string,
		public readonly planId: string,
		public readonly status: SubscriptionStatus,
		public readonly stripeSubscriptionId: string | null,
	) {}

	static createFromStripeCheckout(params: {
		tenantId: string;
		planId: string;
		stripeSubscriptionId: string;
	}): TenantSubscription {
		return new TenantSubscription(
			randomUUID(),
			params.tenantId,
			params.planId,
			"active",
			params.stripeSubscriptionId,
		);
	}

	static fromPrimitives(primitives: TenantSubscriptionPrimitives): TenantSubscription {
		return new TenantSubscription(
			primitives.id,
			primitives.tenantId,
			primitives.planId,
			primitives.status,
			primitives.stripeSubscriptionId,
		);
	}

	toPrimitives(): TenantSubscriptionPrimitives {
		return {
			id: this.id,
			tenantId: this.tenantId,
			planId: this.planId,
			status: this.status,
			stripeSubscriptionId: this.stripeSubscriptionId,
		};
	}
}
