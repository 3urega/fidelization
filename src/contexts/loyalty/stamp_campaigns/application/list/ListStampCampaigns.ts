import { Service } from "diod";

import { TenantRole } from "../../../../tenants/memberships/domain/TenantRole";
import { TenantAccessSuspended } from "../../../../tenants/tenants/domain/TenantAccessSuspended";
import { TenantNotFound } from "../../../../tenants/tenants/domain/TenantNotFound";
import { TenantRepository } from "../../../../tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../../../../tenants/tenants/domain/TenantStatus";
import { StampCampaign } from "../../domain/StampCampaign";
import { StampCampaignForbidden } from "../../domain/StampCampaignForbidden";
import { StampCampaignRepository } from "../../domain/StampCampaignRepository";

export type ListStampCampaignsParams = {
	tenantId: string;
	role: TenantRole;
};

@Service()
export class ListStampCampaigns {
	constructor(
		private readonly tenantRepository: TenantRepository,
		private readonly stampCampaignRepository: StampCampaignRepository,
	) {}

	async execute(params: ListStampCampaignsParams): Promise<StampCampaign[]> {
		if (params.role !== TenantRole.Owner) {
			throw new StampCampaignForbidden(params.role);
		}

		await this.assertTenantAllowsLoyalty(params.tenantId);

		return this.stampCampaignRepository.listByTenant(params.tenantId);
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
