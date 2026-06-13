import type { PlatformBillingOverview } from "../../contexts/platform/domain/PlatformBillingOverview";

export type PlatformBillingOverviewResponse = {
	mrrCents: number;
	mrrFormula: string;
	activeSubscriptions: number;
	pastDueCount: number;
	billingSuspendedTenants: number;
	subscriptions: {
		subscriptionId: string;
		tenantId: string;
		tenantSlug: string;
		tenantName: string;
		tenantStatus: string;
		planName: string;
		priceMonthly: number;
		status: string;
		startedAt: string;
		endsAt: string | null;
		stripeSubscriptionId: string | null;
		stripeDashboardUrl: string | null;
	}[];
	generatedAt: string;
};

export function platformBillingOverviewToJson(
	overview: PlatformBillingOverview,
): PlatformBillingOverviewResponse {
	return {
		mrrCents: overview.mrrCents,
		mrrFormula: overview.mrrFormula,
		activeSubscriptions: overview.activeSubscriptions,
		pastDueCount: overview.pastDueCount,
		billingSuspendedTenants: overview.billingSuspendedTenants,
		subscriptions: overview.subscriptions.map((row) => ({
			subscriptionId: row.subscriptionId,
			tenantId: row.tenantId,
			tenantSlug: row.tenantSlug,
			tenantName: row.tenantName,
			tenantStatus: row.tenantStatus,
			planName: row.planName,
			priceMonthly: row.priceMonthly,
			status: row.status,
			startedAt: row.startedAt.toISOString(),
			endsAt: row.endsAt?.toISOString() ?? null,
			stripeSubscriptionId: row.stripeSubscriptionId,
			stripeDashboardUrl: row.stripeDashboardUrl,
		})),
		generatedAt: overview.generatedAt.toISOString(),
	};
}
