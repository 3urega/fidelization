import type {
	PlatformAppUserDetail,
	PlatformAppUsersPage,
} from "../../contexts/platform/domain/PlatformAppUserSummary";

export function platformAppUsersPageToJson(page: PlatformAppUsersPage): Record<string, unknown> {
	return {
		users: page.users.map((user) => ({
			userId: user.userId,
			name: user.name,
			email: user.email,
			qrValue: user.qrValue,
			createdAt: user.createdAt.toISOString(),
			establishmentsCount: user.establishmentsCount,
			lastTransactionAt: user.lastTransactionAt?.toISOString() ?? null,
		})),
		total: page.total,
		hasMore: page.hasMore,
		offset: page.offset,
		limit: page.limit,
		filter: page.filter,
	};
}

export type PlatformAppUserDetailResponse = {
	userId: string;
	name: string;
	email: string;
	qrValue: string | null;
	createdAt: string;
	establishments: {
		customerId: string;
		tenantId: string;
		tenantSlug: string;
		tenantName: string;
		pointsBalance: number;
		visitsCount: number;
	}[];
	recentTransactions: {
		transactionId: string;
		type: string;
		tenantId: string;
		tenantSlug: string;
		tenantName: string;
		createdAt: string;
		points: number | null;
	}[];
	generatedAt: string;
};

export function platformAppUserDetailToJson(
	detail: PlatformAppUserDetail,
): PlatformAppUserDetailResponse {
	return {
		userId: detail.userId,
		name: detail.name,
		email: detail.email,
		qrValue: detail.qrValue,
		createdAt: detail.createdAt.toISOString(),
		establishments: detail.establishments.map((establishment) => ({
			customerId: establishment.customerId,
			tenantId: establishment.tenantId,
			tenantSlug: establishment.tenantSlug,
			tenantName: establishment.tenantName,
			pointsBalance: establishment.pointsBalance,
			visitsCount: establishment.visitsCount,
		})),
		recentTransactions: detail.recentTransactions.map((transaction) => ({
			transactionId: transaction.transactionId,
			type: transaction.type,
			tenantId: transaction.tenantId,
			tenantSlug: transaction.tenantSlug,
			tenantName: transaction.tenantName,
			createdAt: transaction.createdAt.toISOString(),
			points: transaction.points,
		})),
		generatedAt: detail.generatedAt.toISOString(),
	};
}
