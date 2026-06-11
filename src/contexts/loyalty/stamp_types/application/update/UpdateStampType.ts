import { Service } from "diod";

import { TenantRole } from "../../../../tenants/memberships/domain/TenantRole";
import { TenantAccessSuspended } from "../../../../tenants/tenants/domain/TenantAccessSuspended";
import { TenantNotFound } from "../../../../tenants/tenants/domain/TenantNotFound";
import { TenantRepository } from "../../../../tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../../../../tenants/tenants/domain/TenantStatus";
import { StampType } from "../../domain/StampType";
import { parseStampTypeDeactivate } from "../../domain/StampTypeUpdateInput";
import { StampTypeForbidden } from "../../domain/StampTypeForbidden";
import { StampTypeNotFound } from "../../domain/StampTypeNotFound";
import { StampTypeRepository } from "../../domain/StampTypeRepository";

export type UpdateStampTypeParams = {
	tenantId: string;
	role: TenantRole;
	stampTypeId: string;
	input: {
		isActive?: boolean;
	};
};

@Service()
export class UpdateStampType {
	constructor(
		private readonly tenantRepository: TenantRepository,
		private readonly stampTypeRepository: StampTypeRepository,
	) {}

	async execute(params: UpdateStampTypeParams): Promise<StampType> {
		if (params.role !== TenantRole.Owner) {
			throw new StampTypeForbidden(params.role);
		}

		await this.assertTenantAllowsLoyalty(params.tenantId);

		parseStampTypeDeactivate(params.input);

		const existing = await this.stampTypeRepository.searchById(
			params.tenantId,
			params.stampTypeId,
		);

		if (!existing) {
			throw new StampTypeNotFound(params.stampTypeId);
		}

		const updated = existing.deactivate();
		await this.stampTypeRepository.save(updated);

		return updated;
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
