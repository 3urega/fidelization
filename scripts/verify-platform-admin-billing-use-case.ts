/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { GetPlatformBillingOverview } from "../src/contexts/platform/application/billing/GetPlatformBillingOverview";
import {
	PLATFORM_BILLING_MRR_FORMULA,
	type PlatformBillingOverview,
	type PlatformBillingSubscriptionRow,
} from "../src/contexts/platform/domain/PlatformBillingOverview";
import { PlatformBillingReadRepository } from "../src/contexts/platform/domain/PlatformBillingReadRepository";

const proSub: PlatformBillingSubscriptionRow = {
	subscriptionId: "sub-pro",
	tenantId: "tenant-pro",
	tenantSlug: "cafe-pro",
	tenantName: "Cafe Pro",
	tenantStatus: "active",
	planName: "pro",
	priceMonthly: 2900,
	status: "active",
	startedAt: new Date("2026-06-01T10:00:00.000Z"),
	endsAt: null,
	stripeSubscriptionId: "sub_stripe_pro",
	stripeDashboardUrl: "https://dashboard.stripe.com/test/subscriptions/sub_stripe_pro",
};

const premiumSub: PlatformBillingSubscriptionRow = {
	subscriptionId: "sub-premium",
	tenantId: "tenant-premium",
	tenantSlug: "cafe-premium",
	tenantName: "Cafe Premium",
	tenantStatus: "active",
	planName: "premium",
	priceMonthly: 5900,
	status: "active",
	startedAt: new Date("2026-06-02T10:00:00.000Z"),
	endsAt: null,
	stripeSubscriptionId: "sub_stripe_premium",
	stripeDashboardUrl: "https://dashboard.stripe.com/test/subscriptions/sub_stripe_premium",
};

const pastDueSub: PlatformBillingSubscriptionRow = {
	subscriptionId: "sub-past-due",
	tenantId: "tenant-past-due",
	tenantSlug: "cafe-past-due",
	tenantName: "Cafe Past Due",
	tenantStatus: "suspended",
	planName: "pro",
	priceMonthly: 2900,
	status: "past_due",
	startedAt: new Date("2026-05-01T10:00:00.000Z"),
	endsAt: null,
	stripeSubscriptionId: "sub_stripe_past_due",
	stripeDashboardUrl: "https://dashboard.stripe.com/test/subscriptions/sub_stripe_past_due",
};

class InMemoryPlatformBillingReadRepository extends PlatformBillingReadRepository {
	constructor(private readonly overview: PlatformBillingOverview) {
		super();
	}

	async getOverview(): Promise<PlatformBillingOverview> {
		return this.overview;
	}
}

async function main(): Promise<void> {
	const overview: PlatformBillingOverview = {
		mrrCents: 8800,
		mrrFormula: PLATFORM_BILLING_MRR_FORMULA,
		activeSubscriptions: 2,
		pastDueCount: 1,
		billingSuspendedTenants: 1,
		subscriptions: [proSub, premiumSub, pastDueSub],
		generatedAt: new Date("2026-06-13T12:00:00.000Z"),
	};

	const useCase = new GetPlatformBillingOverview(
		new InMemoryPlatformBillingReadRepository(overview),
	);

	const result = await useCase.execute();

	if (result.mrrCents !== 8800 || result.activeSubscriptions !== 2 || result.pastDueCount !== 1) {
		console.error("❌ unexpected billing metrics", result);
		process.exit(1);
	}

	if (result.billingSuspendedTenants !== 1) {
		console.error("❌ expected billingSuspendedTenants = 1", result.billingSuspendedTenants);
		process.exit(1);
	}

	if (result.subscriptions.length !== 3 || result.subscriptions[0]?.planName !== "pro") {
		console.error("❌ unexpected subscriptions list", result.subscriptions);
		process.exit(1);
	}

	if (!result.mrrFormula.includes("price_monthly")) {
		console.error("❌ mrrFormula missing documentation", result.mrrFormula);
		process.exit(1);
	}

	console.log("✅ GetPlatformBillingOverview returns MRR + subscription rows");
	console.log("✅ verify:platform-admin-billing-use-case passed");
}

void main();
