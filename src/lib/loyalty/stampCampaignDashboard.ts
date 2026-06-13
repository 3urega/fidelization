export type StampCampaignDashboardScans = {
	today: number;
	yesterday: number;
	last7Days: number;
	sinceStart: number;
};

export type StampCampaignDashboardCampaign = {
	id: string;
	name: string;
	stampTypeLabel: string;
	requiredStamps: number;
	createdAt: string;
	scans: StampCampaignDashboardScans;
};

export type StampCampaignDashboardResponse = {
	campaigns?: StampCampaignDashboardCampaign[];
	generatedAt?: string;
	timezone?: string;
	error?: {
		description?: string;
	};
};
