import { Service } from "diod";

import { GENERIC_STAMP_VISIT_LABEL } from "../../../stamp_types/domain/StampType";
import { StampTypeRepository } from "../../../stamp_types/domain/StampTypeRepository";
import type { StampAddedSummary } from "../../domain/StampProgressSummary";
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
		private readonly stampTypeRepository: StampTypeRepository,
	) {}

	async execute(params: GetCustomerStampProgressParams): Promise<StampAddedSummary[]> {
		await this.assertTenantAllowsLoyalty(params.tenantId);

		const campaigns = await this.stampCampaignRepository.listActiveByTenant(params.tenantId);
		const typeLabels = await this.loadTypeLabels(params.tenantId, campaigns);
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
				stampTypeId: campaign.stampTypeId,
				stampTypeLabel: campaign.stampTypeId
					? (typeLabels.get(campaign.stampTypeId) ?? GENERIC_STAMP_VISIT_LABEL)
					: GENERIC_STAMP_VISIT_LABEL,
				visualTemplate: campaign.visualTemplate,
				cardBackgroundVariant: campaign.cardBackgroundVariant,
				conditions: campaign.conditions,
			});
		}

		return summaries;
	}

	private async loadTypeLabels(
		tenantId: string,
		campaigns: { stampTypeId: string | null }[],
	): Promise<Map<string, string>> {
		const ids = Array.from(
			new Set(
				campaigns
					.map((campaign) => campaign.stampTypeId)
					.filter((id): id is string => id !== null),
			),
		);
		const labels = new Map<string, string>();

		await Promise.all(
			ids.map(async (id) => {
				const stampType = await this.stampTypeRepository.searchById(tenantId, id);
				if (stampType) {
					labels.set(id, stampType.label);
				}
			}),
		);

		return labels;
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
