export type StampCampaignScanCounts = {
	today: number;
	yesterday: number;
	last7Days: number;
	sinceStart: number;
};

export const emptyStampCampaignScanCounts = (): StampCampaignScanCounts => ({
	today: 0,
	yesterday: 0,
	last7Days: 0,
	sinceStart: 0,
});
