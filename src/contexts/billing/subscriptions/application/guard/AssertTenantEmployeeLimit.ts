import { Service } from "diod";

import { TenantMembershipRepository } from "../../../../tenants/memberships/domain/TenantMembershipRepository";
import { SubscriptionPlan } from "../../domain/SubscriptionPlan";
import { TenantPlanLimitExceeded } from "../../domain/TenantPlanLimitExceeded";
import { areTenantPlanGatesDisabled } from "../../domain/TenantPlanFeature";
import { ResolveTenantSubscriptionPlan } from "../resolve/ResolveTenantSubscriptionPlan";

@Service()
export class AssertTenantEmployeeLimit {
	constructor(
		private readonly resolveTenantSubscriptionPlan: ResolveTenantSubscriptionPlan,
		private readonly membershipRepository: TenantMembershipRepository,
	) {}

	async execute(tenantId: string): Promise<SubscriptionPlan> {
		const plan = await this.resolveTenantSubscriptionPlan.execute(tenantId);

		if (areTenantPlanGatesDisabled()) {
			return plan;
		}

		const limit = plan.limits?.employees;

		if (limit === undefined) {
			return plan;
		}

		const employees = await this.membershipRepository.listEmployeesByTenant(tenantId);

		if (employees.length >= limit) {
			throw new TenantPlanLimitExceeded(tenantId, limit, employees.length);
		}

		return plan;
	}
}
