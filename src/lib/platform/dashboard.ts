export type PlatformDashboardTenantSummary = {
	id: string;
	name: string;
	slug: string;
	status: string;
	createdAt: string;
};

export type PlatformDashboardResponse = {
	tenantsActive: number;
	tenantsSuspended: number;
	usersRegistered: number;
	qrScansToday: number;
	stampsToday: number;
	activePromotions: number;
	subscriptionsPastDue: number;
	recentTenants: PlatformDashboardTenantSummary[];
	generatedAt: string;
	timezone: string;
};
