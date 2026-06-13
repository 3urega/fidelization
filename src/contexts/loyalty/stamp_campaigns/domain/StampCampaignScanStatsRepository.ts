import { StampCampaignScanCounts } from "./StampCampaignScanCounts";
import { StampScanGlobalWindows } from "./StampScanTimeWindows";

export type StampCampaignScanStatsCampaignRef = {
	id: string;
	createdAt: Date;
};

export type CountScansForActiveCampaignsParams = {
	tenantId: string;
	campaigns: StampCampaignScanStatsCampaignRef[];
	windows: StampScanGlobalWindows;
};

export abstract class StampCampaignScanStatsRepository {
	abstract countScansForActiveCampaigns(
		params: CountScansForActiveCampaignsParams,
	): Promise<Map<string, StampCampaignScanCounts>>;
}
