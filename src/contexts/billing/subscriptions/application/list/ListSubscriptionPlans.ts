import { Service } from "diod";

import { TenantRole, isStaffRole } from "../../../../tenants/memberships/domain/TenantRole";
import { TenantAccessSuspended } from "../../../../tenants/tenants/domain/TenantAccessSuspended";
import { TenantNotFound } from "../../../../tenants/tenants/domain/TenantNotFound";
import { TenantRepository } from "../../../../tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../../../../tenants/tenants/domain/TenantStatus";
import { SubscriptionPlan } from "../../domain/SubscriptionPlan";
import { TenantBillingForbidden } from "../../domain/TenantBillingForbidden";
import { TenantBillingRepository } from "../../domain/TenantBillingRepository";

export type ListSubscriptionPlansParams = {
	tenantId: string;
	role: TenantRole;
};

@Service()
export class ListSubscriptionPlans {
	constructor(
		private readonly tenantRepository: TenantRepository,
		private readonly billingRepository: TenantBillingRepository,
	) {}

	async execute(params: ListSubscriptionPlansParams): Promise<SubscriptionPlan[]> {
		if (!isStaffRole(params.role)) {
			throw new TenantBillingForbidden(params.role);
		}

		await this.assertTenantActive(params.tenantId);

		return this.billingRepository.listActivePlans();
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
