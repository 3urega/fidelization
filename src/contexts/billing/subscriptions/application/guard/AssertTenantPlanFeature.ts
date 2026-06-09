import { Service } from "diod";

import { PlanFeatureNotAvailable } from "../../domain/PlanFeatureNotAvailable";
import { SubscriptionPlan } from "../../domain/SubscriptionPlan";
import { isPlanFeatureEnabled, type TenantPlanFeature } from "../../domain/TenantPlanFeature";
import { ResolveTenantSubscriptionPlan } from "../resolve/ResolveTenantSubscriptionPlan";

export type AssertTenantPlanFeatureParams = {
	tenantId: string;
	feature: TenantPlanFeature;
};

@Service()
export class AssertTenantPlanFeature {
	constructor(private readonly resolveTenantSubscriptionPlan: ResolveTenantSubscriptionPlan) {}

	async execute(params: AssertTenantPlanFeatureParams): Promise<SubscriptionPlan> {
		const plan = await this.resolveTenantSubscriptionPlan.execute(params.tenantId);

		if (!isPlanFeatureEnabled(plan.features, params.feature)) {
			throw new PlanFeatureNotAvailable(params.tenantId, params.feature);
		}

		return plan;
	}
}
