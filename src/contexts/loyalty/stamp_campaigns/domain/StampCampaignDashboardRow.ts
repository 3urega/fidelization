import { StampCampaignScanCounts } from "./StampCampaignScanCounts";

export type StampCampaignDashboardRow = {
	campaignId: string;
	name: string;
	requiredStamps: number;
	createdAt: Date;
	stampTypeId: string | null;
	stampTypeLabel: string;
	scans: StampCampaignScanCounts;
};
