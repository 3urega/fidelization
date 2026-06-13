export type PlatformTenantDetailOwner = {
	userId: string;
	name: string;
	email: string;
};

export type PlatformTenantDetailActivity = {
	customersCount: number;
	staffCount: number;
	qrScansCount: number;
};

export type PlatformSubscriptionPlanOption = {
	id: string;
	name: string;
	priceMonthly: number;
};

export type PlatformTenantDetailResponse = {
	tenant: {
		id: string;
		name: string;
		slug: string;
		subscriptionPlan: string;
		subscriptionPlanId: string | null;
		status: string;
		createdAt: string;
	};
	owners: PlatformTenantDetailOwner[];
	activity: PlatformTenantDetailActivity;
	availablePlans: PlatformSubscriptionPlanOption[];
};
