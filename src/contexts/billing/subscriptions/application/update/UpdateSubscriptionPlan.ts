import { Service } from "diod";

import {
	parseSubscriptionPlanFeatures,
	parseSubscriptionPlanLimits,
	type SubscriptionPlanFeatures,
	type SubscriptionPlanLimits,
} from "../../domain/SubscriptionPlanFeatures";
import { SubscriptionPlan } from "../../domain/SubscriptionPlan";
import { SubscriptionPlanNotFound } from "../../domain/SubscriptionPlanNotFound";
import { TenantBillingRepository } from "../../domain/TenantBillingRepository";

export type UpdateSubscriptionPlanParams = {
	planId: string;
	priceMonthly?: number;
	priceYearly?: number;
	features?: SubscriptionPlanFeatures;
	limits?: SubscriptionPlanLimits | null;
	isActive?: boolean;
};

@Service()
export class UpdateSubscriptionPlan {
	constructor(private readonly billingRepository: TenantBillingRepository) {}

	async execute(params: UpdateSubscriptionPlanParams): Promise<SubscriptionPlan> {
		const existing = await this.billingRepository.searchPlanById(params.planId);
		if (!existing) {
			throw new SubscriptionPlanNotFound(params.planId);
		}

		const current = existing.toPrimitives();
		const priceMonthly =
			params.priceMonthly !== undefined ? assertNonNegativeInt(params.priceMonthly, "priceMonthly") : current.priceMonthly;
		const priceYearly =
			params.priceYearly !== undefined ? assertNonNegativeInt(params.priceYearly, "priceYearly") : current.priceYearly;
		const features =
			params.features !== undefined
				? parseSubscriptionPlanFeatures(params.features)
				: current.features;
		const limits =
			params.limits !== undefined
				? params.limits === null
					? null
					: parseSubscriptionPlanLimits(params.limits)
				: current.limits;

		if (limits?.employees !== undefined && limits.employees < 1) {
			throw new Error("limits.employees must be at least 1");
		}

		const updated = SubscriptionPlan.fromPrimitives({
			id: current.id,
			name: current.name,
			priceMonthly,
			priceYearly,
			features,
			limits,
			isActive: params.isActive ?? current.isActive,
		});

		await this.billingRepository.savePlan(updated);

		return updated;
	}
}

function assertNonNegativeInt(value: number, field: string): number {
	if (!Number.isInteger(value) || value < 0) {
		throw new Error(`${field} must be a non-negative integer`);
	}

	return value;
}
