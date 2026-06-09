import { Service } from "diod";

import { TenantAccessSuspended } from "../../../tenants/domain/TenantAccessSuspended";
import { TenantNotFound } from "../../../tenants/domain/TenantNotFound";
import { TenantRepository } from "../../../tenants/domain/TenantRepository";
import { TenantStatus } from "../../../tenants/domain/TenantStatus";
import { TenantEmployee } from "../../domain/TenantEmployee";
import { TenantEmployeesForbidden } from "../../domain/TenantEmployeesForbidden";
import { TenantMembershipRepository } from "../../domain/TenantMembershipRepository";
import { TenantRole } from "../../domain/TenantRole";

export type ListTenantEmployeesParams = {
	tenantId: string;
	role: TenantRole;
};

@Service()
export class ListTenantEmployees {
	constructor(
		private readonly tenantRepository: TenantRepository,
		private readonly membershipRepository: TenantMembershipRepository,
	) {}

	async execute(params: ListTenantEmployeesParams): Promise<TenantEmployee[]> {
		if (params.role !== TenantRole.Owner) {
			throw new TenantEmployeesForbidden(params.role);
		}

		await this.assertTenantActive(params.tenantId);

		return await this.membershipRepository.listEmployeesByTenant(params.tenantId);
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
