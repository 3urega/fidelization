import { Service } from "diod";

import { TenantRole } from "../../../../tenants/memberships/domain/TenantRole";
import { Tenant } from "../../../../tenants/tenants/domain/Tenant";
import { TenantAccessSuspended } from "../../../../tenants/tenants/domain/TenantAccessSuspended";
import { TenantNotFound } from "../../../../tenants/tenants/domain/TenantNotFound";
import { TenantRepository } from "../../../../tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../../../../tenants/tenants/domain/TenantStatus";
import { SubscriptionPlan } from "../../domain/SubscriptionPlan";
import { SubscriptionPlanNotFound } from "../../domain/SubscriptionPlanNotFound";
import { TenantBillingForbidden } from "../../domain/TenantBillingForbidden";
import { TenantBillingRepository } from "../../domain/TenantBillingRepository";

export type AssignTenantSubscriptionPlanParams = {
	tenantId: string;
	role: TenantRole;
	planId: string;
};

export type AssignTenantSubscriptionPlanResult = {
	tenant: Tenant;
	plan: SubscriptionPlan;
};

@Service()
export class AssignTenantSubscriptionPlan {
	constructor(
		private readonly tenantRepository: TenantRepository,
		private readonly billingRepository: TenantBillingRepository,
	) {}

	async execute(params: AssignTenantSubscriptionPlanParams): Promise<AssignTenantSubscriptionPlanResult> {
		if (params.role !== TenantRole.Owner) {
			throw new TenantBillingForbidden(params.role);
		}

		await this.assertTenantActive(params.tenantId);

		const planId = params.planId.trim();
		if (!planId) {
			throw new Error("planId is required");
		}

		const plan = await this.billingRepository.searchPlanById(planId);
		if (!plan || !plan.isActive) {
			throw new SubscriptionPlanNotFound(planId);
		}

		await this.billingRepository.linkTenantPlan(params.tenantId, planId);

		const tenant = await this.tenantRepository.findById(params.tenantId);
		if (!tenant) {
			throw new TenantNotFound(params.tenantId);
		}

		return { tenant, plan };
	}

	private async assertTenantActive(tenantId: string): Promise<void> {
		const tenant = await this.tenantRepository.findById(tenantId);
		if (!tenant) {
			throw new TenantNotFound(tenantId);
		}

		if (tenant.status === TenantStatus.Suspended) {
			throw new TenantAccessSuspended(tenantId);
		}
	}
}
