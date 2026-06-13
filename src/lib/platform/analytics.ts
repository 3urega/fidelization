import type { PlatformAnalyticsSummary } from "../../contexts/platform/domain/PlatformAnalyticsSummary";

export type PlatformAnalyticsTenantRankResponse = {
	tenantId: string;
	tenantSlug: string;
	tenantName: string;
	tenantStatus: string;
	value: number;
};

export type PlatformAnalyticsSummaryResponse = {
	periodDays: number;
	periodStart: string;
	periodEnd: string;
	timezone: string;
	platformTotals: {
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
	topTenantsByQrScans: PlatformAnalyticsTenantRankResponse[];
	topTenantsByStamps: PlatformAnalyticsTenantRankResponse[];
	topTenantsByRewardsRedeemed: PlatformAnalyticsTenantRankResponse[];
	generatedAt: string;
};

export function platformAnalyticsSummaryToJson(
	summary: PlatformAnalyticsSummary,
): PlatformAnalyticsSummaryResponse {
	return {
		periodDays: summary.periodDays,
		periodStart: summary.periodStart.toISOString(),
		periodEnd: summary.periodEnd.toISOString(),
		timezone: summary.timezone,
		platformTotals: { ...summary.platformTotals },
		topTenantsByQrScans: summary.topTenantsByQrScans.map(mapRank),
		topTenantsByStamps: summary.topTenantsByStamps.map(mapRank),
		topTenantsByRewardsRedeemed: summary.topTenantsByRewardsRedeemed.map(mapRank),
		generatedAt: summary.generatedAt.toISOString(),
	};
}

function mapRank(
	rank: PlatformAnalyticsSummary["topTenantsByQrScans"][number],
): PlatformAnalyticsTenantRankResponse {
	return {
		tenantId: rank.tenantId,
		tenantSlug: rank.tenantSlug,
		tenantName: rank.tenantName,
		tenantStatus: rank.tenantStatus,
		value: rank.value,
	};
}
