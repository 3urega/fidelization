import { Service } from "diod";

import { prisma } from "../../../lib/prisma";
import { buildZonedRollingPeriodWindow } from "../../../lib/time/zonedCalendarWindows";
import {
	type PlatformAnalyticsPlatformTotals,
	type PlatformAnalyticsSummary,
	type PlatformAnalyticsSummaryParams,
	type PlatformAnalyticsTenantRank,
} from "../domain/PlatformAnalyticsSummary";
import { PlatformAnalyticsReadRepository } from "../domain/PlatformAnalyticsReadRepository";

type PeriodTotalsRow = {
	qr_scans: bigint;
	stamps_issued: bigint;
	rewards_redeemed: bigint;
	active_customers: bigint;
};

type TenantRankRow = {
	tenant_id: string;
	tenant_slug: string;
	tenant_name: string;
	tenant_status: string;
	value: bigint;
};

const TOP_LIMIT = 10;

function toCount(value: bigint): number {
	return Number(value);
}

function mapRankRow(row: TenantRankRow): PlatformAnalyticsTenantRank {
	return {
		tenantId: row.tenant_id,
		tenantSlug: row.tenant_slug,
		tenantName: row.tenant_name,
		tenantStatus: row.tenant_status,
		value: toCount(row.value),
	};
}

@Service()
export class PrismaPlatformAnalyticsReadRepository extends PlatformAnalyticsReadRepository {
	async getSummary(params: PlatformAnalyticsSummaryParams): Promise<PlatformAnalyticsSummary> {
		const window = buildZonedRollingPeriodWindow(
			params.referenceDate,
			params.timezone,
			params.periodDays,
		);

		const [
			tenantsActive,
			tenantsSuspended,
			usersRegistered,
			activePromotions,
			subscriptionsPastDue,
			periodTotals,
			topQrScans,
			topStamps,
			topRewards,
		] = await Promise.all([
			prisma.tenant.count({ where: { status: "active" } }),
			prisma.tenant.count({ where: { status: "suspended" } }),
			prisma.user.count({ where: { platformRole: null } }),
			prisma.promotion.count({ where: { isActive: true } }),
			prisma.subscription.count({ where: { status: "past_due" } }),
			prisma.$queryRaw<PeriodTotalsRow[]>`
				SELECT
					COUNT(*) FILTER (
						WHERE lt.type = 'points_earned'::"LoyaltyTransactionType"
						AND lt.metadata->>'source' = 'staff_scan'
					) AS qr_scans,
					COUNT(*) FILTER (
						WHERE lt.type = 'stamp_added'::"LoyaltyTransactionType"
					) AS stamps_issued,
					COUNT(*) FILTER (
						WHERE lt.type = 'reward_redeemed'::"LoyaltyTransactionType"
					) AS rewards_redeemed,
					COUNT(DISTINCT lt.customer_id) FILTER (
						WHERE lt.type IN (
							'points_earned'::"LoyaltyTransactionType",
							'stamp_added'::"LoyaltyTransactionType",
							'reward_redeemed'::"LoyaltyTransactionType"
						)
					) AS active_customers
				FROM loyalty_transactions lt
				WHERE lt.created_at >= ${window.start}
					AND lt.created_at < ${window.end}
			`,
			prisma.$queryRaw<TenantRankRow[]>`
				SELECT
					t.id AS tenant_id,
					t.slug AS tenant_slug,
					t.name AS tenant_name,
					t.status AS tenant_status,
					COUNT(*) AS value
				FROM loyalty_transactions lt
				INNER JOIN tenants t ON t.id = lt.tenant_id
				WHERE lt.created_at >= ${window.start}
					AND lt.created_at < ${window.end}
					AND lt.type = 'points_earned'::"LoyaltyTransactionType"
					AND lt.metadata->>'source' = 'staff_scan'
				GROUP BY t.id, t.slug, t.name, t.status
				ORDER BY value DESC, t.name ASC
				LIMIT ${TOP_LIMIT}
			`,
			prisma.$queryRaw<TenantRankRow[]>`
				SELECT
					t.id AS tenant_id,
					t.slug AS tenant_slug,
					t.name AS tenant_name,
					t.status AS tenant_status,
					COUNT(*) AS value
				FROM loyalty_transactions lt
				INNER JOIN tenants t ON t.id = lt.tenant_id
				WHERE lt.created_at >= ${window.start}
					AND lt.created_at < ${window.end}
					AND lt.type = 'stamp_added'::"LoyaltyTransactionType"
				GROUP BY t.id, t.slug, t.name, t.status
				ORDER BY value DESC, t.name ASC
				LIMIT ${TOP_LIMIT}
			`,
			prisma.$queryRaw<TenantRankRow[]>`
				SELECT
					t.id AS tenant_id,
					t.slug AS tenant_slug,
					t.name AS tenant_name,
					t.status AS tenant_status,
					COUNT(*) AS value
				FROM loyalty_transactions lt
				INNER JOIN tenants t ON t.id = lt.tenant_id
				WHERE lt.created_at >= ${window.start}
					AND lt.created_at < ${window.end}
					AND lt.type = 'reward_redeemed'::"LoyaltyTransactionType"
				GROUP BY t.id, t.slug, t.name, t.status
				ORDER BY value DESC, t.name ASC
				LIMIT ${TOP_LIMIT}
			`,
		]);

		const totalsRow = periodTotals[0];
		const platformTotals: PlatformAnalyticsPlatformTotals = {
			tenantsActive,
			tenantsSuspended,
			usersRegistered,
			activePromotions,
			subscriptionsPastDue,
			qrScans: totalsRow ? toCount(totalsRow.qr_scans) : 0,
			stampsIssued: totalsRow ? toCount(totalsRow.stamps_issued) : 0,
			rewardsRedeemed: totalsRow ? toCount(totalsRow.rewards_redeemed) : 0,
			activeCustomers: totalsRow ? toCount(totalsRow.active_customers) : 0,
		};

		return {
			periodDays: params.periodDays,
			periodStart: window.start,
			periodEnd: window.end,
			timezone: params.timezone,
			platformTotals,
			topTenantsByQrScans: topQrScans.map(mapRankRow),
			topTenantsByStamps: topStamps.map(mapRankRow),
			topTenantsByRewardsRedeemed: topRewards.map(mapRankRow),
			generatedAt: params.referenceDate,
		};
	}
}
