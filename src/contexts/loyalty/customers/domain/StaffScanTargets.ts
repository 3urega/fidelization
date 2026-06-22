export type StaffScanCampaignTarget = {
	id: string;
	name: string;
	requiredStamps: number;
	visualTemplate: string;
	cardBackgroundVariant: string;
	stampTypeLabel: string;
	conditions: string;
};

export type StaffScanPromotionTarget = {
	id: string;
	title: string;
	description: string;
	maxUsesPerUser: number | null;
};

export type StaffScanRouletteAuthorizeTarget = {
	enabled: boolean;
	minPurchaseEuros: number | null;
};

export type StaffScanTargets = {
	stampCampaigns: StaffScanCampaignTarget[];
	promotions: StaffScanPromotionTarget[];
	rouletteAuthorize: StaffScanRouletteAuthorizeTarget;
};
