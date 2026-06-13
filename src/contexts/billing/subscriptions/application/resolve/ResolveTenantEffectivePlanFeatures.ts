import { Service } from "diod";

import { TenantRepository } from "../../../../tenants/tenants/domain/TenantRepository";
import type { SubscriptionPlanFeatures } from "../../domain/SubscriptionPlanFeatures";
import { SubscriptionPlan } from "../../domain/SubscriptionPlan";
import {
	mergeEffectivePlanFeatures,
	type TenantFeatureOverrides,
} from "../../domain/TenantFeatureOverrides";
import { ResolveTenantSubscriptionPlan } from "./ResolveTenantSubscriptionPlan";

export type TenantEffectivePlanFeatures = {
	plan: SubscriptionPlan;
	overrides: TenantFeatureOverrides | null;
	effectiveFeatures: SubscriptionPlanFeatures;
};

@Service()
export class ResolveTenantEffectivePlanFeatures {
	constructor(
		private readonly resolveTenantSubscriptionPlan: ResolveTenantSubscriptionPlan,
		private readonly tenantRepository: TenantRepository,
	) {}

	async execute(tenantId: string): Promise<TenantEffectivePlanFeatures> {
		const plan = await this.resolveTenantSubscriptionPlan.execute(tenantId);
		const overrides = await this.tenantRepository.findFeatureOverrides(tenantId);

		return {
			plan,
			overrides,
			effectiveFeatures: mergeEffectivePlanFeatures(plan.features, overrides),
		};
	}
}
