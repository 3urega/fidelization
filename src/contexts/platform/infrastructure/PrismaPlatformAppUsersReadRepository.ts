import { Service } from "diod";

import { prisma } from "../../../lib/prisma";
import { buildZonedRollingPeriodWindow } from "../../../lib/time/zonedCalendarWindows";
import {
	type PlatformAppUserDetail,
	type PlatformAppUserEstablishment,
	type PlatformAppUserRow,
	type PlatformAppUsersListParams,
	type PlatformAppUsersPage,
	type PlatformAppUserTransaction,
} from "../domain/PlatformAppUserSummary";
import { PlatformAppUsersReadRepository } from "../domain/PlatformAppUsersReadRepository";

type UserStatsRow = {
	user_id: string;
	name: string;
	email: string;
	qr_value: string | null;
	created_at: Date;
	establishments_count: number;
	last_transaction_at: Date | null;
};

type CountRow = {
	total: number;
};

const RECENT_TRANSACTIONS_LIMIT = 20;

function mapListRow(row: UserStatsRow): PlatformAppUserRow {
	return {
		userId: row.user_id,
		name: row.name,
		email: row.email,
		qrValue: row.qr_value,
		createdAt: row.created_at,
		establishmentsCount: row.establishments_count,
		lastTransactionAt: row.last_transaction_at,
	};
}

@Service()
export class PrismaPlatformAppUsersReadRepository extends PlatformAppUsersReadRepository {
	async list(params: PlatformAppUsersListParams): Promise<PlatformAppUsersPage> {
		const search = params.search?.trim();
		const searchPattern = search ? `%${search}%` : null;
		const newSince =
			params.filter === "new_7d"
				? buildZonedRollingPeriodWindow(params.referenceDate, params.timezone, 7).start
				: null;
		const filterWithEstablishments = params.filter === "with_establishments";
		const filterNoActivity = params.filter === "no_activity";

		const [countRows, rows] = await Promise.all([
			prisma.$queryRaw<CountRow[]>`
				SELECT COUNT(*)::int AS total
				FROM (
					SELECT u.id
					FROM users u
					LEFT JOIN customers c ON c.user_id = u.id
					LEFT JOIN loyalty_transactions lt ON lt.customer_id = c.id
					WHERE u.platform_role IS NULL
					AND (
						${searchPattern}::text IS NULL
						OR u.name ILIKE ${searchPattern}
						OR u.email ILIKE ${searchPattern}
					)
					AND (
						${newSince}::timestamptz IS NULL
						OR u.created_at >= ${newSince}
					)
					GROUP BY u.id
					HAVING (
						${filterWithEstablishments}::boolean IS FALSE
						OR COUNT(DISTINCT c.id) > 0
					)
					AND (
						${filterNoActivity}::boolean IS FALSE
						OR COUNT(lt.id) = 0
					)
				) filtered_users
			`,
			prisma.$queryRaw<UserStatsRow[]>`
				SELECT
					u.id AS user_id,
					u.name,
					u.email,
					u.qr_value,
					u.created_at,
					COUNT(DISTINCT c.tenant_id)::int AS establishments_count,
					MAX(lt.created_at) AS last_transaction_at
				FROM users u
				LEFT JOIN customers c ON c.user_id = u.id
				LEFT JOIN loyalty_transactions lt ON lt.customer_id = c.id
				WHERE u.platform_role IS NULL
				AND (
					${searchPattern}::text IS NULL
					OR u.name ILIKE ${searchPattern}
					OR u.email ILIKE ${searchPattern}
				)
				AND (
					${newSince}::timestamptz IS NULL
					OR u.created_at >= ${newSince}
				)
				GROUP BY u.id
				HAVING (
					${filterWithEstablishments}::boolean IS FALSE
					OR COUNT(DISTINCT c.id) > 0
				)
				AND (
					${filterNoActivity}::boolean IS FALSE
					OR COUNT(lt.id) = 0
				)
				ORDER BY u.name ASC
				OFFSET ${params.offset}
				LIMIT ${params.limit + 1}
			`,
		]);

		const total = countRows[0]?.total ?? 0;
		const hasMore = rows.length > params.limit;
		const pageRows = hasMore ? rows.slice(0, params.limit) : rows;

		return {
			users: pageRows.map(mapListRow),
			total,
			hasMore,
			offset: params.offset,
			limit: params.limit,
			filter: params.filter,
		};
	}

	async getDetail(userId: string): Promise<PlatformAppUserDetail | null> {
		const user = await prisma.user.findFirst({
			where: { id: userId, platformRole: null },
			select: {
				id: true,
				name: true,
				email: true,
				qrValue: true,
				createdAt: true,
			},
		});

		if (!user) {
			return null;
		}

		const [customers, transactions] = await Promise.all([
			prisma.customer.findMany({
				where: { userId },
				include: {
					tenant: {
						select: { id: true, slug: true, name: true },
					},
				},
				orderBy: { tenant: { name: "asc" } },
			}),
			prisma.loyaltyTransaction.findMany({
				where: { customer: { userId } },
				include: {
					tenant: {
						select: { id: true, slug: true, name: true },
					},
				},
				orderBy: { createdAt: "desc" },
				take: RECENT_TRANSACTIONS_LIMIT,
			}),
		]);

		const establishments: PlatformAppUserEstablishment[] = customers.map((customer) => ({
			customerId: customer.id,
			tenantId: customer.tenant.id,
			tenantSlug: customer.tenant.slug,
			tenantName: customer.tenant.name,
			pointsBalance: customer.pointsBalance,
			visitsCount: customer.visitsCount,
		}));

		const recentTransactions: PlatformAppUserTransaction[] = transactions.map((transaction) => ({
			transactionId: transaction.id,
			type: transaction.type,
			tenantId: transaction.tenant.id,
			tenantSlug: transaction.tenant.slug,
			tenantName: transaction.tenant.name,
			createdAt: transaction.createdAt,
			points: transaction.points,
		}));

		return {
			userId: user.id,
			name: user.name,
			email: user.email,
			qrValue: user.qrValue,
			createdAt: user.createdAt,
			establishments,
			recentTransactions,
			generatedAt: new Date(),
		};
	}
}
