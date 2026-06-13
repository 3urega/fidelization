import { Service } from "diod";

import { SubscriptionPlan } from "../../../billing/subscriptions/domain/SubscriptionPlan";
import { SubscriptionPlanNotFound } from "../../../billing/subscriptions/domain/SubscriptionPlanNotFound";
import { TenantBillingRepository } from "../../../billing/subscriptions/domain/TenantBillingRepository";
import { Tenant } from "../../../tenants/tenants/domain/Tenant";
import { TenantNotFound } from "../../../tenants/tenants/domain/TenantNotFound";
import { TenantRepository } from "../../../tenants/tenants/domain/TenantRepository";

export type AssignPlatformTenantSubscriptionPlanParams = {
	tenantId: string;
	planId: string;
};

export type AssignPlatformTenantSubscriptionPlanResult = {
	tenant: Tenant;
	plan: SubscriptionPlan;
};

@Service()
export class AssignPlatformTenantSubscriptionPlan {
	constructor(
		private readonly tenantRepository: TenantRepository,
		private readonly billingRepository: TenantBillingRepository,
	) {}

	async execute(
		params: AssignPlatformTenantSubscriptionPlanParams,
	): Promise<AssignPlatformTenantSubscriptionPlanResult> {
		const tenantId = params.tenantId.trim();
		const planId = params.planId.trim();

		if (!planId) {
			throw new Error("planId is required");
		}

		const existing = await this.tenantRepository.findById(tenantId);
		if (!existing) {
			throw new TenantNotFound(tenantId);
		}

		const plan = await this.billingRepository.searchPlanById(planId);
		if (!plan || !plan.isActive) {
			throw new SubscriptionPlanNotFound(planId);
		}

		await this.billingRepository.linkTenantPlan(tenantId, planId);

		const tenant = await this.tenantRepository.findById(tenantId);
		if (!tenant) {
			throw new TenantNotFound(tenantId);
		}

		return { tenant, plan };
	}
}
