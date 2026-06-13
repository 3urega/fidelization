import { Service } from "diod";

import { prisma } from "../../../lib/prisma";
import { endOfZonedDayUtc, startOfZonedDayUtc } from "../../../lib/time/zonedCalendarWindows";
import {
	type PlatformDashboardMetrics,
	type PlatformDashboardMetricsParams,
	type PlatformDashboardTenantSummary,
} from "../domain/PlatformDashboardMetrics";
import { PlatformDashboardReadRepository } from "../domain/PlatformDashboardReadRepository";

type LoyaltyActivityRow = {
	qr_scans_today: bigint;
	stamps_today: bigint;
};

function toCount(value: bigint): number {
	return Number(value);
}

function mapTenantRow(row: {
	id: string;
	name: string;
	slug: string;
	status: string;
	createdAt: Date;
}): PlatformDashboardTenantSummary {
	return {
		id: row.id,
		name: row.name,
		slug: row.slug,
		status: row.status,
		createdAt: row.createdAt,
	};
}

@Service()
export class PrismaPlatformDashboardReadRepository extends PlatformDashboardReadRepository {
	async getMetrics(params: PlatformDashboardMetricsParams): Promise<PlatformDashboardMetrics> {
		const todayStart = startOfZonedDayUtc(params.referenceDate, params.timezone);
		const todayEnd = endOfZonedDayUtc(params.referenceDate, params.timezone);

		const [
			tenantsActive,
			tenantsSuspended,
			usersRegistered,
			activePromotions,
			subscriptionsPastDue,
			recentTenantRows,
			loyaltyActivity,
		] = await Promise.all([
			prisma.tenant.count({ where: { status: "active" } }),
			prisma.tenant.count({ where: { status: "suspended" } }),
			prisma.user.count({ where: { platformRole: null } }),
			prisma.promotion.count({ where: { isActive: true } }),
			prisma.subscription.count({ where: { status: "past_due" } }),
			prisma.tenant.findMany({
				orderBy: { createdAt: "desc" },
				take: 5,
				select: {
					id: true,
					name: true,
					slug: true,
					status: true,
					createdAt: true,
				},
			}),
			prisma.$queryRaw<LoyaltyActivityRow[]>`
				SELECT
					COUNT(*) FILTER (
						WHERE lt.type = 'points_earned'::"LoyaltyTransactionType"
						AND lt.metadata->>'source' = 'staff_scan'
						AND lt.created_at >= ${todayStart}
						AND lt.created_at < ${todayEnd}
					) AS qr_scans_today,
					COUNT(*) FILTER (
						WHERE lt.type = 'stamp_added'::"LoyaltyTransactionType"
						AND lt.created_at >= ${todayStart}
						AND lt.created_at < ${todayEnd}
					) AS stamps_today
				FROM loyalty_transactions lt
			`,
		]);

		const activity = loyaltyActivity[0];

		return {
			tenantsActive,
			tenantsSuspended,
			usersRegistered,
			qrScansToday: activity ? toCount(activity.qr_scans_today) : 0,
			stampsToday: activity ? toCount(activity.stamps_today) : 0,
			activePromotions,
			subscriptionsPastDue,
			recentTenants: recentTenantRows.map(mapTenantRow),
			generatedAt: params.referenceDate,
			timezone: params.timezone,
		};
	}
}
