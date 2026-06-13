import { Service } from "diod";

import { PlanFeatureNotAvailable } from "../../domain/PlanFeatureNotAvailable";
import { SubscriptionPlan } from "../../domain/SubscriptionPlan";
import { isPlanFeatureEnabled, type TenantPlanFeature } from "../../domain/TenantPlanFeature";
import { ResolveTenantEffectivePlanFeatures } from "../resolve/ResolveTenantEffectivePlanFeatures";

export type AssertTenantPlanFeatureParams = {
	tenantId: string;
	feature: TenantPlanFeature;
};

@Service()
export class AssertTenantPlanFeature {
	constructor(private readonly resolveTenantEffectivePlanFeatures: ResolveTenantEffectivePlanFeatures) {}

	async execute(params: AssertTenantPlanFeatureParams): Promise<SubscriptionPlan> {
		const resolved = await this.resolveTenantEffectivePlanFeatures.execute(params.tenantId);

		if (!isPlanFeatureEnabled(resolved.effectiveFeatures, params.feature)) {
			throw new PlanFeatureNotAvailable(params.tenantId, params.feature);
		}

		return resolved.plan;
	}
}
