/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { GetPlatformAnalyticsSummary } from "../src/contexts/platform/application/analytics/GetPlatformAnalyticsSummary";
import {
	type PlatformAnalyticsSummary,
	type PlatformAnalyticsSummaryParams,
} from "../src/contexts/platform/domain/PlatformAnalyticsSummary";
import { PlatformAnalyticsReadRepository } from "../src/contexts/platform/domain/PlatformAnalyticsReadRepository";

const referenceDate = new Date("2026-06-13T15:00:00.000Z");
const timezone = "Europe/Madrid";

class InMemoryPlatformAnalyticsReadRepository extends PlatformAnalyticsReadRepository {
	constructor(private readonly summary: PlatformAnalyticsSummary) {
		super();
	}

	async getSummary(params: PlatformAnalyticsSummaryParams): Promise<PlatformAnalyticsSummary> {
		return {
			...this.summary,
			periodDays: params.periodDays,
			generatedAt: params.referenceDate,
			timezone: params.timezone,
		};
	}
}

async function main(): Promise<void> {
	const stubSummary: PlatformAnalyticsSummary = {
		periodDays: 7,
		periodStart: new Date("2026-06-07T00:00:00.000Z"),
		periodEnd: new Date("2026-06-13T23:59:59.999Z"),
		timezone,
		platformTotals: {
			tenantsActive: 4,
			tenantsSuspended: 1,
			usersRegistered: 50,
			activePromotions: 3,
			subscriptionsPastDue: 1,
			qrScans: 120,
			stampsIssued: 85,
			rewardsRedeemed: 12,
			activeCustomers: 40,
		},
		topTenantsByQrScans: [
			{
				tenantId: "t1",
				tenantSlug: "cafe-demo",
				tenantName: "Cafe Demo",
				tenantStatus: "active",
				value: 80,
			},
			{
				tenantId: "t2",
				tenantSlug: "cafe-norte",
				tenantName: "Cafe Norte",
				tenantStatus: "active",
				value: 40,
			},
		],
		topTenantsByStamps: [
			{
				tenantId: "t1",
				tenantSlug: "cafe-demo",
				tenantName: "Cafe Demo",
				tenantStatus: "active",
				value: 60,
			},
		],
		topTenantsByRewardsRedeemed: [
			{
				tenantId: "t2",
				tenantSlug: "cafe-norte",
				tenantName: "Cafe Norte",
				tenantStatus: "active",
				value: 8,
			},
		],
		generatedAt: referenceDate,
	};

	const useCase = new GetPlatformAnalyticsSummary(
		new InMemoryPlatformAnalyticsReadRepository(stubSummary),
	);

	const result = await useCase.execute({ referenceDate, periodDays: 7 });

	if (result.platformTotals.qrScans !== 120 || result.platformTotals.stampsIssued !== 85) {
		console.error("❌ unexpected period totals", result.platformTotals);
		process.exit(1);
	}

	if (result.topTenantsByQrScans[0]?.tenantSlug !== "cafe-demo") {
		console.error("❌ unexpected top QR tenant", result.topTenantsByQrScans);
		process.exit(1);
	}

	if (result.topTenantsByRewardsRedeemed[0]?.value !== 8) {
		console.error("❌ unexpected top rewards tenant", result.topTenantsByRewardsRedeemed);
		process.exit(1);
	}

	const thirtyDay = await useCase.execute({ referenceDate, periodDays: 30 });
	if (thirtyDay.periodDays !== 30) {
		console.error("❌ expected periodDays 30", thirtyDay.periodDays);
		process.exit(1);
	}

	try {
		await useCase.execute({ periodDays: 14 });
		console.error("❌ expected invalid periodDays error");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof Error) || !error.message.includes("periodDays")) {
			console.error("❌ unexpected error for invalid periodDays", error);
			process.exit(1);
		}
	}

	console.log("✅ GetPlatformAnalyticsSummary returns totals + top tenants");
	console.log("✅ verify:platform-admin-analytics-use-case passed");
}

void main();
