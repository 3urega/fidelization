export type PlatformDashboardTenantSummary = {
	id: string;
	name: string;
	slug: string;
	status: string;
	createdAt: Date;
};

export type PlatformDashboardMetrics = {
	tenantsActive: number;
	tenantsSuspended: number;
	usersRegistered: number;
	qrScansToday: number;
	stampsToday: number;
	activePromotions: number;
	subscriptionsPastDue: number;
	recentTenants: PlatformDashboardTenantSummary[];
	generatedAt: Date;
	timezone: string;
};

export type PlatformDashboardMetricsParams = {
	referenceDate: Date;
	timezone: string;
};
