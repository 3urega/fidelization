export type PlatformAppUserFilter = "all" | "new_7d" | "no_activity" | "with_establishments";

export type PlatformAppUserRow = {
	userId: string;
	name: string;
	email: string;
	qrValue: string | null;
	createdAt: Date;
	establishmentsCount: number;
	lastTransactionAt: Date | null;
};

export type PlatformAppUsersListParams = {
	offset: number;
	limit: number;
	search?: string;
	filter: PlatformAppUserFilter;
	referenceDate: Date;
	timezone: string;
};

export type PlatformAppUsersPage = {
	users: PlatformAppUserRow[];
	total: number;
	hasMore: boolean;
	offset: number;
	limit: number;
	filter: PlatformAppUserFilter;
};

export type PlatformAppUserEstablishment = {
	customerId: string;
	tenantId: string;
	tenantSlug: string;
	tenantName: string;
	pointsBalance: number;
	visitsCount: number;
};

export type PlatformAppUserTransaction = {
	transactionId: string;
	type: string;
	tenantId: string;
	tenantSlug: string;
	tenantName: string;
	createdAt: Date;
	points: number | null;
};

export type PlatformAppUserDetail = {
	userId: string;
	name: string;
	email: string;
	qrValue: string | null;
	createdAt: Date;
	establishments: PlatformAppUserEstablishment[];
	recentTransactions: PlatformAppUserTransaction[];
	generatedAt: Date;
};

export const PLATFORM_APP_USER_FILTERS: PlatformAppUserFilter[] = [
	"all",
	"new_7d",
	"no_activity",
	"with_establishments",
];

export function parsePlatformAppUserFilter(value: string | undefined): PlatformAppUserFilter {
	if (value === "new_7d" || value === "no_activity" || value === "with_establishments") {
		return value;
	}

	return "all";
}
