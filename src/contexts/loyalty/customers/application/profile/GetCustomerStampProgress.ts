import { Service } from "diod";

import { StampAddedSummary } from "../scan/RecordCustomerVisitByQr";
import { StampCampaignRepository } from "../../../stamp_campaigns/domain/StampCampaignRepository";
import { TenantAccessSuspended } from "../../../../tenants/tenants/domain/TenantAccessSuspended";
import { TenantNotFound } from "../../../../tenants/tenants/domain/TenantNotFound";
import { TenantRepository } from "../../../../tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../../../../tenants/tenants/domain/TenantStatus";

export type GetCustomerStampProgressParams = {
	tenantId: string;
	customerId: string;
};

@Service()
export class GetCustomerStampProgress {
	constructor(
		private readonly tenantRepository: TenantRepository,
		private readonly stampCampaignRepository: StampCampaignRepository,
	) {}

	async execute(params: GetCustomerStampProgressParams): Promise<StampAddedSummary[]> {
		await this.assertTenantAllowsLoyalty(params.tenantId);

		const campaigns = await this.stampCampaignRepository.listActiveByTenant(params.tenantId);
		const summaries: StampAddedSummary[] = [];

		for (const campaign of campaigns) {
			const progress = await this.stampCampaignRepository.searchProgress(
				params.tenantId,
				params.customerId,
				campaign.id,
			);

			summaries.push({
				campaignId: campaign.id,
				campaignName: campaign.name,
				current: progress?.currentStamps ?? 0,
				required: campaign.requiredStamps,
				completed: progress?.completed ?? false,
			});
		}

		return summaries;
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
