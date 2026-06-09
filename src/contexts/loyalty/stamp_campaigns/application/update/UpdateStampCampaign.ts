import { Service } from "diod";

import { TenantRole } from "../../../../tenants/memberships/domain/TenantRole";
import { TenantAccessSuspended } from "../../../../tenants/tenants/domain/TenantAccessSuspended";
import { TenantNotFound } from "../../../../tenants/tenants/domain/TenantNotFound";
import { TenantRepository } from "../../../../tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../../../../tenants/tenants/domain/TenantStatus";
import { StampCampaign } from "../../domain/StampCampaign";
import { StampCampaignForbidden } from "../../domain/StampCampaignForbidden";
import { StampCampaignNotFound } from "../../domain/StampCampaignNotFound";
import { StampCampaignRepository } from "../../domain/StampCampaignRepository";
import { parseStampCampaignDeactivate } from "../../domain/StampCampaignUpdateInput";

export type UpdateStampCampaignParams = {
	tenantId: string;
	role: TenantRole;
	campaignId: string;
	input: {
		isActive?: boolean;
	};
};

@Service()
export class UpdateStampCampaign {
	constructor(
		private readonly tenantRepository: TenantRepository,
		private readonly stampCampaignRepository: StampCampaignRepository,
	) {}

	async execute(params: UpdateStampCampaignParams): Promise<StampCampaign> {
		if (params.role !== TenantRole.Owner) {
			throw new StampCampaignForbidden(params.role);
		}

		await this.assertTenantAllowsLoyalty(params.tenantId);

		parseStampCampaignDeactivate(params.input);

		const existing = await this.stampCampaignRepository.searchCampaignById(
			params.tenantId,
			params.campaignId,
		);

		if (!existing) {
			throw new StampCampaignNotFound(params.campaignId);
		}

		const updated = existing.deactivate();
		await this.stampCampaignRepository.saveCampaign(updated);

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
