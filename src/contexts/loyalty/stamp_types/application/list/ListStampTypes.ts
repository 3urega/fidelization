import { Service } from "diod";

import { TenantRole } from "../../../../tenants/memberships/domain/TenantRole";
import { TenantAccessSuspended } from "../../../../tenants/tenants/domain/TenantAccessSuspended";
import { TenantNotFound } from "../../../../tenants/tenants/domain/TenantNotFound";
import { TenantRepository } from "../../../../tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../../../../tenants/tenants/domain/TenantStatus";
import { StampType } from "../../domain/StampType";
import { StampTypeForbidden } from "../../domain/StampTypeForbidden";
import { StampTypeRepository } from "../../domain/StampTypeRepository";

export type ListStampTypesParams = {
	tenantId: string;
	role: TenantRole;
};

@Service()
export class ListStampTypes {
	constructor(
		private readonly tenantRepository: TenantRepository,
		private readonly stampTypeRepository: StampTypeRepository,
	) {}

	async execute(params: ListStampTypesParams): Promise<StampType[]> {
		if (params.role !== TenantRole.Owner && params.role !== TenantRole.Employee) {
			throw new StampTypeForbidden(params.role);
		}

		await this.assertTenantAllowsLoyalty(params.tenantId);

		if (params.role === TenantRole.Owner) {
			return this.stampTypeRepository.listByTenant(params.tenantId);
		}

		return this.stampTypeRepository.listActiveByTenant(params.tenantId);
	}

	private async assertTenantAllowsLoyalty(tenantId: string): Promise<void> {
		const tenant = await this.tenantRepository.findById(tenantId);
		if (!tenant) {
			throw new TenantNotFound(tenantId);
		}

		if (tenant.status === TenantStatus.Suspended) {
			throw new TenantAccessSuspended(tenantId);
		}
	}
}
