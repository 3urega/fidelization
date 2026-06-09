import { Service } from "diod";

import { TenantRole } from "../../../../tenants/memberships/domain/TenantRole";
import { TenantAccessSuspended } from "../../../../tenants/tenants/domain/TenantAccessSuspended";
import { TenantNotFound } from "../../../../tenants/tenants/domain/TenantNotFound";
import { TenantRepository } from "../../../../tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../../../../tenants/tenants/domain/TenantStatus";
import { StampCampaign } from "../../domain/StampCampaign";
import { parseStampCampaignCreate } from "../../domain/StampCampaignCreateInput";
import { StampCampaignForbidden } from "../../domain/StampCampaignForbidden";
import { StampCampaignRepository } from "../../domain/StampCampaignRepository";

export type CreateStampCampaignParams = {
	tenantId: string;
	role: TenantRole;
	input: {
		name?: string;
		requiredStamps?: number;
	};
};

@Service()
export class CreateStampCampaign {
	constructor(
		private readonly tenantRepository: TenantRepository,
		private readonly stampCampaignRepository: StampCampaignRepository,
	) {}

	async execute(params: CreateStampCampaignParams): Promise<StampCampaign> {
		if (params.role !== TenantRole.Owner) {
			throw new StampCampaignForbidden(params.role);
		}

		await this.assertTenantAllowsLoyalty(params.tenantId);

		const parsed = parseStampCampaignCreate(params.input);
		const campaign = StampCampaign.create({
			tenantId: params.tenantId,
			name: parsed.name,
			requiredStamps: parsed.requiredStamps,
		});

		await this.stampCampaignRepository.saveCampaign(campaign);

		return campaign;
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
