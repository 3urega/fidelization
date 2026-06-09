import { Service } from "diod";

import { TenantNotFound } from "../../../../tenants/tenants/domain/TenantNotFound";
import { TenantRepository } from "../../../../tenants/tenants/domain/TenantRepository";
import {
	BASIC_PLAN_FEATURES,
	parseSubscriptionPlanLimits,
} from "../../domain/SubscriptionPlanFeatures";
import { SubscriptionPlan } from "../../domain/SubscriptionPlan";
import { TenantBillingRepository } from "../../domain/TenantBillingRepository";

@Service()
export class ResolveTenantSubscriptionPlan {
	constructor(
		private readonly tenantRepository: TenantRepository,
		private readonly billingRepository: TenantBillingRepository,
	) {}

	async execute(tenantId: string): Promise<SubscriptionPlan> {
		const tenant = await this.tenantRepository.findById(tenantId);
		if (!tenant) {
			throw new TenantNotFound(tenantId);
		}

		const primitives = tenant.toPrimitives();

		if (primitives.subscriptionPlanId) {
			const planById = await this.billingRepository.searchPlanById(primitives.subscriptionPlanId);
			if (planById) {
				return planById;
			}
		}

		const planByName = await this.billingRepository.searchPlanByName(primitives.subscriptionPlan);
		if (planByName) {
			return planByName;
		}

		const basicPlan = await this.billingRepository.searchPlanByName("basic");
		if (basicPlan) {
			return basicPlan;
		}

		return SubscriptionPlan.fromPrimitives({
			id: "fallback-basic",
			name: "basic",
			priceMonthly: 0,
			priceYearly: 0,
			features: BASIC_PLAN_FEATURES,
			limits: parseSubscriptionPlanLimits({ employees: 3 }),
			isActive: true,
		});
	}
}
