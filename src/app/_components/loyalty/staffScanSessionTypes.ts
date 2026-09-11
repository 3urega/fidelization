export type StaffScanSessionCustomer = {
	id: string;
	name: string;
	pointsBalance: number;
	visitsCount: number;
};

export type StaffScanSessionRouletteTenantContext = {
	unlockEnabled: boolean;
	authorizeEnabled: boolean;
	minPurchaseEuros: number | null;
};

export type StaffScanSessionTenantCapabilities = {
	stampCampaignsEnabled: boolean;
	promotionsEnabled: boolean;
	roulette: StaffScanSessionRouletteTenantContext | null;
	physicalRedeemEnabled: boolean;
};

export type StaffScanSessionStampCard = {
	campaignId: string;
	campaignName: string;
	current: number;
	required: number;
	completed: boolean;
	stampTypeId: string | null;
	stampTypeLabel: string;
	visualTemplate: string;
	cardBackgroundVariant: string;
	conditions: string;
	canAddStamp: boolean;
	blockReason: string | null;
};

export type StaffScanSessionPromotion = {
	id: string;
	title: string;
	description: string;
	maxUsesPerUser: number | null;
	usedCount: number;
	canApply: boolean;
	blockReason: string | null;
};

export type StaffScanSessionRouletteParticipation = {
	status: string;
	enrolledAt: string | null;
	periodEndsAt: string | null;
	rules: {
		participationPeriodDays: number;
		maxSpinsInPeriod: number;
		maxSpinsPerDay: number;
		minPurchaseEuros: number | null;
		participationConditionsText: string | null;
		requiresEnrollment: boolean;
	};
	spinsUsedInPeriod: number;
	spinsRemainingInPeriod: number;
	spinsUsedToday: number;
	spinsRemainingToday: number;
	pendingAuthorization: { expiresAt: string } | null;
};

export type StaffScanSessionRoulette = {
	participation: StaffScanSessionRouletteParticipation;
	pendingPhysicalCount: number;
};

export type StaffScanSessionData = {
	customer: StaffScanSessionCustomer;
	tenantCapabilities: StaffScanSessionTenantCapabilities;
	stampCards: StaffScanSessionStampCard[];
	promotions: StaffScanSessionPromotion[];
	roulette: StaffScanSessionRoulette | null;
};

export type StaffScanSessionError = {
	status: number;
	message: string;
};
