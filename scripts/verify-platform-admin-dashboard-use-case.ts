/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { GetPlatformDashboardMetrics } from "../src/contexts/platform/application/dashboard/GetPlatformDashboardMetrics";
import {
	type PlatformDashboardMetrics,
	type PlatformDashboardMetricsParams,
	type PlatformDashboardTenantSummary,
} from "../src/contexts/platform/domain/PlatformDashboardMetrics";
import { PlatformDashboardReadRepository } from "../src/contexts/platform/domain/PlatformDashboardReadRepository";

const referenceDate = new Date("2026-06-13T15:00:00.000Z");
const timezone = "Europe/Madrid";

const recentTenants: PlatformDashboardTenantSummary[] = [
	{
		id: "tenant-2",
		name: "Cafe Nuevo",
		slug: "cafe-nuevo",
		status: "active",
		createdAt: new Date("2026-06-12T10:00:00.000Z"),
	},
	{
		id: "tenant-1",
		name: "Cafe Demo",
		slug: "cafe-demo",
		status: "active",
		createdAt: new Date("2026-06-01T10:00:00.000Z"),
	},
];

class InMemoryPlatformDashboardReadRepository extends PlatformDashboardReadRepository {
	constructor(private readonly metrics: PlatformDashboardMetrics) {
		super();
	}

	async getMetrics(params: PlatformDashboardMetricsParams): Promise<PlatformDashboardMetrics> {
		return {
			...this.metrics,
			generatedAt: params.referenceDate,
			timezone: params.timezone,
		};
	}
}

async function main(): Promise<void> {
	const stubMetrics: PlatformDashboardMetrics = {
		tenantsActive: 3,
		tenantsSuspended: 1,
		usersRegistered: 42,
		qrScansToday: 7,
		stampsToday: 5,
		activePromotions: 2,
		subscriptionsPastDue: 1,
		recentTenants,
		generatedAt: referenceDate,
		timezone,
	};

	const useCase = new GetPlatformDashboardMetrics(
		new InMemoryPlatformDashboardReadRepository(stubMetrics),
	);

	const result = await useCase.execute({ referenceDate });

	if (result.tenantsActive !== 3 || result.qrScansToday !== 7 || result.stampsToday !== 5) {
		console.error("❌ unexpected metrics", result);
		process.exit(1);
	}

	if (result.recentTenants.length !== 2 || result.recentTenants[0]?.slug !== "cafe-nuevo") {
		console.error("❌ unexpected recent tenants", result.recentTenants);
		process.exit(1);
	}

	if (result.timezone !== timezone) {
		console.error("❌ expected timezone Europe/Madrid from env, got", result.timezone);
		process.exit(1);
	}

	console.log("✅ GetPlatformDashboardMetrics aggregates platform read model");
	console.log("✅ verify:platform-admin-dashboard-use-case passed");
}

void main();
