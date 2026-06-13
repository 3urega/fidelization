export type PlatformAnalyticsTenantRank = {
	tenantId: string;
	tenantSlug: string;
	tenantName: string;
	tenantStatus: string;
	value: number;
};

export type PlatformAnalyticsPlatformTotals = {
	tenantsActive: number;
	tenantsSuspended: number;
	usersRegistered: number;
	activePromotions: number;
	subscriptionsPastDue: number;
	qrScans: number;
	stampsIssued: number;
	rewardsRedeemed: number;
	activeCustomers: number;
};

export type PlatformAnalyticsSummary = {
	periodDays: number;
	periodStart: Date;
	periodEnd: Date;
	timezone: string;
	platformTotals: PlatformAnalyticsPlatformTotals;
	topTenantsByQrScans: PlatformAnalyticsTenantRank[];
	topTenantsByStamps: PlatformAnalyticsTenantRank[];
	topTenantsByRewardsRedeemed: PlatformAnalyticsTenantRank[];
	generatedAt: Date;
};

export type PlatformAnalyticsSummaryParams = {
	referenceDate: Date;
	timezone: string;
	periodDays: number;
};

export const PLATFORM_ANALYTICS_ALLOWED_PERIOD_DAYS = [7, 30] as const;
export type PlatformAnalyticsPeriodDays = (typeof PLATFORM_ANALYTICS_ALLOWED_PERIOD_DAYS)[number];
