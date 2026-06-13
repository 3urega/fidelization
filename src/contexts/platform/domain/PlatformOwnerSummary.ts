export type PlatformOwnerBusiness = {
	tenantId: string;
	slug: string;
	name: string;
	subscriptionPlan: string;
	status: string;
};

export type PlatformOwnerSummary = {
	userId: string;
	name: string;
	email: string;
	businesses: PlatformOwnerBusiness[];
};

export type PlatformOwnersListParams = {
	offset: number;
	limit: number;
	search?: string;
};

export type PlatformOwnersPage = {
	owners: PlatformOwnerSummary[];
	total: number;
	hasMore: boolean;
	offset: number;
	limit: number;
};
