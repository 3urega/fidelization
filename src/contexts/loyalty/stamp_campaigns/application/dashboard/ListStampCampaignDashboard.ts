import { Service } from "diod";

import { env } from "../../../../../lib/env";
import { GENERIC_STAMP_VISIT_LABEL } from "../../../stamp_types/domain/StampType";
import { StampTypeRepository } from "../../../stamp_types/domain/StampTypeRepository";
import { TenantRole } from "../../../../tenants/memberships/domain/TenantRole";
import { TenantAccessSuspended } from "../../../../tenants/tenants/domain/TenantAccessSuspended";
import { TenantNotFound } from "../../../../tenants/tenants/domain/TenantNotFound";
import { TenantRepository } from "../../../../tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../../../../tenants/tenants/domain/TenantStatus";
import { StampCampaignDashboardRow } from "../../domain/StampCampaignDashboardRow";
import { StampCampaignForbidden } from "../../domain/StampCampaignForbidden";
import { emptyStampCampaignScanCounts } from "../../domain/StampCampaignScanCounts";
import { StampCampaignRepository } from "../../domain/StampCampaignRepository";
import { StampCampaignScanStatsRepository } from "../../domain/StampCampaignScanStatsRepository";
import { StampScanTimeWindows } from "../../domain/StampScanTimeWindows";

export type ListStampCampaignDashboardParams = {
	tenantId: string;
	role: TenantRole;
	referenceDate?: Date;
};

export type ListStampCampaignDashboardResult = {
	campaigns: StampCampaignDashboardRow[];
	generatedAt: Date;
	timezone: string;
};

@Service()
export class ListStampCampaignDashboard {
	constructor(
		private readonly tenantRepository: TenantRepository,
		private readonly stampCampaignRepository: StampCampaignRepository,
		private readonly stampCampaignScanStatsRepository: StampCampaignScanStatsRepository,
		private readonly stampTypeRepository: StampTypeRepository,
	) {}

	async execute(params: ListStampCampaignDashboardParams): Promise<ListStampCampaignDashboardResult> {
		if (params.role !== TenantRole.Owner) {
			throw new StampCampaignForbidden(params.role);
		}

		await this.assertTenantAllowsLoyalty(params.tenantId);

		const referenceDate = params.referenceDate ?? new Date();
		const timezone = env.appTimezone;
		const windows = StampScanTimeWindows.forReference(referenceDate, timezone);
		const campaigns = await this.stampCampaignRepository.listActiveByTenant(params.tenantId);

		if (campaigns.length === 0) {
			return {
				campaigns: [],
				generatedAt: referenceDate,
				timezone,
			};
		}

		const campaignRefs = campaigns.map((campaign) => ({
			id: campaign.id,
			createdAt: campaign.createdAt ?? referenceDate,
		}));
		const countsByCampaignId = await this.stampCampaignScanStatsRepository.countScansForActiveCampaigns(
			{
				tenantId: params.tenantId,
				campaigns: campaignRefs,
				windows,
			},
		);
		const stampTypes = await this.stampTypeRepository.listByTenant(params.tenantId);
		const labelByTypeId = new Map(stampTypes.map((type) => [type.id, type.label]));

		const rows: StampCampaignDashboardRow[] = campaigns.map((campaign) => {
			const createdAt = campaign.createdAt ?? referenceDate;
			const scans = countsByCampaignId.get(campaign.id) ?? emptyStampCampaignScanCounts();
			const stampTypeLabel = campaign.stampTypeId
				? (labelByTypeId.get(campaign.stampTypeId) ?? GENERIC_STAMP_VISIT_LABEL)
				: GENERIC_STAMP_VISIT_LABEL;

			return {
				campaignId: campaign.id,
				name: campaign.name,
				requiredStamps: campaign.requiredStamps,
				createdAt,
				stampTypeId: campaign.stampTypeId,
				stampTypeLabel,
				scans,
			};
		});

		return {
			campaigns: rows,
			generatedAt: referenceDate,
			timezone,
		};
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
