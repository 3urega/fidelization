import { Service } from "diod";

import { ListPlatformSubscriptionPlans } from "../../../billing/subscriptions/application/list/ListPlatformSubscriptionPlans";
import { UpdateSubscriptionPlan } from "../../../billing/subscriptions/application/update/UpdateSubscriptionPlan";
import type { SubscriptionPlanFeatures } from "../../../billing/subscriptions/domain/SubscriptionPlanFeatures";
import { SubscriptionPlan } from "../../../billing/subscriptions/domain/SubscriptionPlan";
import { PLATFORM_PLAN_FEATURE_CATALOG } from "../../../../lib/platform/featureCatalog";

export type PlatformPlanFeaturesRow = {
	id: string;
	name: string;
	features: SubscriptionPlanFeatures;
};

export type ListPlatformPlanFeaturesResult = {
	plans: PlatformPlanFeaturesRow[];
	featureCatalog: typeof PLATFORM_PLAN_FEATURE_CATALOG;
};

@Service()
export class ListPlatformPlanFeatures {
	constructor(private readonly listPlatformSubscriptionPlans: ListPlatformSubscriptionPlans) {}

	async execute(): Promise<ListPlatformPlanFeaturesResult> {
		const plans = await this.listPlatformSubscriptionPlans.execute();

		return {
			plans: plans.map((plan) => {
				const primitives = plan.toPrimitives();

				return {
					id: primitives.id,
					name: primitives.name,
					features: primitives.features,
				};
			}),
			featureCatalog: PLATFORM_PLAN_FEATURE_CATALOG,
		};
	}
}

export type UpdatePlatformPlanFeaturesParams = {
	planId: string;
	features: SubscriptionPlanFeatures;
};

@Service()
export class UpdatePlatformPlanFeatures {
	constructor(private readonly updateSubscriptionPlan: UpdateSubscriptionPlan) {}

	async execute(params: UpdatePlatformPlanFeaturesParams): Promise<SubscriptionPlan> {
		return this.updateSubscriptionPlan.execute({
			planId: params.planId,
			features: params.features,
		});
	}
}
