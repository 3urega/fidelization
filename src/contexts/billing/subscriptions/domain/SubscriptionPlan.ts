export type SubscriptionPlanPrimitives = {
	id: string;
	name: string;
	priceMonthly: number;
	priceYearly: number;
	isActive: boolean;
};

export class SubscriptionPlan {
	private constructor(
		public readonly id: string,
		public readonly name: string,
		public readonly priceMonthly: number,
		public readonly priceYearly: number,
		public readonly isActive: boolean,
	) {}

	static fromPrimitives(primitives: SubscriptionPlanPrimitives): SubscriptionPlan {
		return new SubscriptionPlan(
			primitives.id,
			primitives.name,
			primitives.priceMonthly,
			primitives.priceYearly,
			primitives.isActive,
		);
	}

	toPrimitives(): SubscriptionPlanPrimitives {
		return {
			id: this.id,
			name: this.name,
			priceMonthly: this.priceMonthly,
			priceYearly: this.priceYearly,
			isActive: this.isActive,
		};
	}
}
