import {
	parseSubscriptionPlanFeatures,
	parseSubscriptionPlanLimits,
	type SubscriptionPlanFeatures,
	type SubscriptionPlanLimits,
} from "./SubscriptionPlanFeatures";

export type SubscriptionPlanPrimitives = {
	id: string;
	name: string;
	priceMonthly: number;
	priceYearly: number;
	features: SubscriptionPlanFeatures;
	limits: SubscriptionPlanLimits | null;
	isActive: boolean;
};

export class SubscriptionPlan {
	private constructor(
		public readonly id: string,
		public readonly name: string,
		public readonly priceMonthly: number,
		public readonly priceYearly: number,
		public readonly features: SubscriptionPlanFeatures,
		public readonly limits: SubscriptionPlanLimits | null,
		public readonly isActive: boolean,
	) {}

	static fromPrimitives(primitives: SubscriptionPlanPrimitives): SubscriptionPlan {
		return new SubscriptionPlan(
			primitives.id,
			primitives.name,
			primitives.priceMonthly,
			primitives.priceYearly,
			primitives.features,
			primitives.limits,
			primitives.isActive,
		);
	}

	toPrimitives(): SubscriptionPlanPrimitives {
		return {
			id: this.id,
			name: this.name,
			priceMonthly: this.priceMonthly,
			priceYearly: this.priceYearly,
			features: this.features,
			limits: this.limits,
			isActive: this.isActive,
		};
	}

	static fromPersistence(row: {
		id: string;
		name: string;
		priceMonthly: number;
		priceYearly: number;
		features: unknown;
		limits: unknown;
		isActive: boolean;
	}): SubscriptionPlan {
		return SubscriptionPlan.fromPrimitives({
			id: row.id,
			name: row.name,
			priceMonthly: row.priceMonthly,
			priceYearly: row.priceYearly,
			features: parseSubscriptionPlanFeatures(row.features),
			limits: parseSubscriptionPlanLimits(row.limits),
			isActive: row.isActive,
		});
	}
}
