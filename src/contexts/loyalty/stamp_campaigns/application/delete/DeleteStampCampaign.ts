import { Service } from "diod";

import { TenantRole } from "../../../../tenants/memberships/domain/TenantRole";
import { TenantAccessSuspended } from "../../../../tenants/tenants/domain/TenantAccessSuspended";
import { TenantNotFound } from "../../../../tenants/tenants/domain/TenantNotFound";
import { TenantRepository } from "../../../../tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../../../../tenants/tenants/domain/TenantStatus";
import { StampCampaignActiveCannotBeDeleted } from "../../domain/StampCampaignActiveCannotBeDeleted";
import { StampCampaignForbidden } from "../../domain/StampCampaignForbidden";
import { StampCampaignNotFound } from "../../domain/StampCampaignNotFound";
import { StampCampaignRepository } from "../../domain/StampCampaignRepository";

export type DeleteStampCampaignParams = {
	tenantId: string;
	role: TenantRole;
	campaignId: string;
};

@Service()
export class DeleteStampCampaign {
	constructor(
		private readonly tenantRepository: TenantRepository,
		private readonly stampCampaignRepository: StampCampaignRepository,
	) {}

	async execute(params: DeleteStampCampaignParams): Promise<void> {
		if (params.role !== TenantRole.Owner) {
			throw new StampCampaignForbidden(params.role);
		}

		await this.assertTenantAllowsLoyalty(params.tenantId);

		const existing = await this.stampCampaignRepository.searchCampaignById(
			params.tenantId,
			params.campaignId,
		);

		if (!existing) {
			throw new StampCampaignNotFound(params.campaignId);
		}

		if (existing.isActive) {
			throw new StampCampaignActiveCannotBeDeleted(params.campaignId);
		}

		await this.stampCampaignRepository.deleteCampaign(params.tenantId, params.campaignId);
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
