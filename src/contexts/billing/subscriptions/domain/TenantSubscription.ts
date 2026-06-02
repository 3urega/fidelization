export type SubscriptionStatus = "active" | "past_due" | "canceled";

export type TenantSubscriptionPrimitives = {
	id: string;
	tenantId: string;
	planId: string;
	status: SubscriptionStatus;
};

export class TenantSubscription {
	private constructor(
		public readonly id: string,
		public readonly tenantId: string,
		public readonly planId: string,
		public readonly status: SubscriptionStatus,
	) {}

	static fromPrimitives(primitives: TenantSubscriptionPrimitives): TenantSubscription {
		return new TenantSubscription(
			primitives.id,
			primitives.tenantId,
			primitives.planId,
			primitives.status,
		);
	}

	toPrimitives(): TenantSubscriptionPrimitives {
		return {
			id: this.id,
			tenantId: this.tenantId,
			planId: this.planId,
			status: this.status,
		};
	}
}
