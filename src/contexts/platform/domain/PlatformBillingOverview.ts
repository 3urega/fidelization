export const PLATFORM_BILLING_MRR_FORMULA =
	"SUM(subscription_plans.price_monthly) WHERE subscriptions.status = 'active' (centavos EUR; solo filas Stripe, excluye Basic sin suscripción)";

export type PlatformBillingSubscriptionRow = {
	subscriptionId: string;
	tenantId: string;
	tenantSlug: string;
	tenantName: string;
	tenantStatus: string;
	planName: string;
	priceMonthly: number;
	status: string;
	startedAt: Date;
	endsAt: Date | null;
	stripeSubscriptionId: string | null;
	stripeDashboardUrl: string | null;
};

export type PlatformBillingOverview = {
	mrrCents: number;
	mrrFormula: string;
	activeSubscriptions: number;
	pastDueCount: number;
	billingSuspendedTenants: number;
	subscriptions: PlatformBillingSubscriptionRow[];
	generatedAt: Date;
};
