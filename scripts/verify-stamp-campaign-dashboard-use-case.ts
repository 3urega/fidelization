/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { ListStampCampaignDashboard } from "../src/contexts/loyalty/stamp_campaigns/application/dashboard/ListStampCampaignDashboard";
import { StampCampaign } from "../src/contexts/loyalty/stamp_campaigns/domain/StampCampaign";
import { StampCampaignRepository } from "../src/contexts/loyalty/stamp_campaigns/domain/StampCampaignRepository";
import {
	CountScansForActiveCampaignsParams,
	StampCampaignScanStatsRepository,
} from "../src/contexts/loyalty/stamp_campaigns/domain/StampCampaignScanStatsRepository";
import {
	emptyStampCampaignScanCounts,
	type StampCampaignScanCounts,
} from "../src/contexts/loyalty/stamp_campaigns/domain/StampCampaignScanCounts";
import { StampType } from "../src/contexts/loyalty/stamp_types/domain/StampType";
import { StampTypeRepository } from "../src/contexts/loyalty/stamp_types/domain/StampTypeRepository";
import { TenantAccessSuspended } from "../src/contexts/tenants/tenants/domain/TenantAccessSuspended";
import { Tenant } from "../src/contexts/tenants/tenants/domain/Tenant";
import { TenantNotFound } from "../src/contexts/tenants/tenants/domain/TenantNotFound";
import { TenantRepository } from "../src/contexts/tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../src/contexts/tenants/tenants/domain/TenantStatus";

const tenantId = "00000000-0000-4000-8000-0000000000d1";
const cafeTypeId = "00000000-0000-4000-8000-0000000000t1";
const referenceDate = new Date("2026-06-11T15:00:00.000Z");
const timezone = "Europe/Madrid";

const baseTenant = Tenant.fromPrimitives({
	id: tenantId,
	name: "Dashboard Verify Cafe",
	slug: "dashboard-verify-cafe",
	logoUrl: "",
	primaryColor: "#7C3AED",
	secondaryColor: "#4F46E5",
	subscriptionPlan: "FREE",
	subscriptionPlanId: null,
	status: TenantStatus.Active,
	createdAt: new Date().toISOString(),
});

class StubTenantRepository extends TenantRepository {
	constructor(private readonly tenant: Tenant | null) {
		super();
	}

	async findAll(): Promise<Tenant[]> {
		return this.tenant ? [this.tenant] : [];
	}

	async findById(id: string): Promise<Tenant | null> {
		return id === this.tenant?.id ? this.tenant : null;
	}

	async updateStatus(): Promise<Tenant | null> {
		return null;
	}

	async updateBranding(): Promise<Tenant | null> {
		return null;
	}
}

class InMemoryStampCampaignRepository extends StampCampaignRepository {
	constructor(private readonly campaigns: StampCampaign[]) {
		super();
	}

	async saveCampaign(campaign: StampCampaign): Promise<void> {
		const index = this.campaigns.findIndex((item) => item.id === campaign.id);
		if (index >= 0) {
			this.campaigns[index] = campaign;
		} else {
			this.campaigns.push(campaign);
		}
	}

	async deleteCampaign(): Promise<void> {}

	async searchCampaignById(tenantId: string, id: string): Promise<StampCampaign | null> {
		return (
			this.campaigns.find((campaign) => campaign.tenantId === tenantId && campaign.id === id) ??
			null
		);
	}

	async listByTenant(tenantId: string): Promise<StampCampaign[]> {
		return this.campaigns.filter((campaign) => campaign.tenantId === tenantId);
	}

	async listActiveByTenant(tenantId: string): Promise<StampCampaign[]> {
		return this.campaigns.filter(
			(campaign) => campaign.tenantId === tenantId && campaign.isActive,
		);
	}

	async saveProgress(): Promise<void> {}

	async searchProgress(): Promise<null> {
		return null;
	}

	async hasActiveGenericCampaigns(): Promise<boolean> {
		return false;
	}
}

type ScanEvent = {
	campaignId: string;
	scannedAt: Date;
};

class InMemoryStampCampaignScanStatsRepository extends StampCampaignScanStatsRepository {
	constructor(private readonly scans: ScanEvent[]) {
		super();
	}

	async countScansForActiveCampaigns(
		params: CountScansForActiveCampaignsParams,
	): Promise<Map<string, StampCampaignScanCounts>> {
		const counts = new Map<string, StampCampaignScanCounts>();

		for (const campaign of params.campaigns) {
			const campaignScans = this.scans.filter((scan) => scan.campaignId === campaign.id);
			const row = emptyStampCampaignScanCounts();

			for (const scan of campaignScans) {
				if (isWithinWindow(scan.scannedAt, params.windows.today)) {
					row.today += 1;
				}

				if (isWithinWindow(scan.scannedAt, params.windows.yesterday)) {
					row.yesterday += 1;
				}

				if (isWithinWindow(scan.scannedAt, params.windows.last7Days)) {
					row.last7Days += 1;
				}

				if (scan.scannedAt >= campaign.createdAt) {
					row.sinceStart += 1;
				}
			}

			counts.set(campaign.id, row);
		}

		return counts;
	}
}

class InMemoryStampTypeRepository extends StampTypeRepository {
	constructor(private readonly types: StampType[]) {
		super();
	}

	async save(): Promise<void> {}

	async searchById(tenantId: string, id: string): Promise<StampType | null> {
		return this.types.find((type) => type.tenantId === tenantId && type.id === id) ?? null;
	}

	async searchBySlug(): Promise<null> {
		return null;
	}

	async listByTenant(tenantId: string): Promise<StampType[]> {
		return this.types.filter((type) => type.tenantId === tenantId);
	}

	async listActiveByTenant(tenantId: string): Promise<StampType[]> {
		return this.types.filter((type) => type.tenantId === tenantId && type.isActive);
	}

	async countActiveByTenant(): Promise<number> {
		return 0;
	}

	async maxSortOrder(): Promise<number> {
		return 0;
	}
}

function isWithinWindow(instant: Date, window: { start: Date; end: Date }): boolean {
	return instant >= window.start && instant < window.end;
}

function campaignWithCreatedAt(
	base: StampCampaign,
	createdAt: Date,
	overrides?: Partial<ReturnType<StampCampaign["toPrimitives"]>>,
): StampCampaign {
	return StampCampaign.fromPrimitives({
		...base.toPrimitives(),
		...overrides,
		createdAt,
	});
}

async function main(): Promise<void> {
	const cafeType = StampType.fromPrimitives({
		id: cafeTypeId,
		tenantId,
		label: "Café",
		slug: "cafe",
		sortOrder: 0,
		isActive: true,
	});

	const activeCampaign = campaignWithCreatedAt(
		StampCampaign.create({
			tenantId,
			name: "10 cafés gratis",
			requiredStamps: 10,
			stampTypeId: cafeTypeId,
		}),
		new Date("2026-06-05T00:00:00.000Z"),
	);

	const inactiveCampaign = campaignWithCreatedAt(
		StampCampaign.create({
			tenantId,
			name: "Campaña inactiva",
			requiredStamps: 5,
			stampTypeId: cafeTypeId,
		}).deactivate(),
		new Date("2026-06-01T00:00:00.000Z"),
	);

	const scans: ScanEvent[] = [
		{ campaignId: activeCampaign.id, scannedAt: new Date("2026-06-11T10:00:00.000Z") },
		{ campaignId: activeCampaign.id, scannedAt: new Date("2026-06-11T11:30:00.000Z") },
		{ campaignId: activeCampaign.id, scannedAt: new Date("2026-06-10T09:00:00.000Z") },
		{ campaignId: activeCampaign.id, scannedAt: new Date("2026-06-09T09:00:00.000Z") },
		{ campaignId: activeCampaign.id, scannedAt: new Date("2026-06-06T09:00:00.000Z") },
		{ campaignId: activeCampaign.id, scannedAt: new Date("2026-06-04T09:00:00.000Z") },
		{ campaignId: inactiveCampaign.id, scannedAt: new Date("2026-06-11T10:00:00.000Z") },
	];

	const listDashboard = new ListStampCampaignDashboard(
		new StubTenantRepository(baseTenant),
		new InMemoryStampCampaignRepository([activeCampaign, inactiveCampaign]),
		new InMemoryStampCampaignScanStatsRepository(scans),
		new InMemoryStampTypeRepository([cafeType]),
	);

	const emptyDashboard = new ListStampCampaignDashboard(
		new StubTenantRepository(baseTenant),
		new InMemoryStampCampaignRepository([]),
		new InMemoryStampCampaignScanStatsRepository([]),
		new InMemoryStampTypeRepository([cafeType]),
	);

	const emptyResult = await emptyDashboard.execute({ tenantId, referenceDate });
	if (emptyResult.campaigns.length !== 0) {
		console.error("❌ expected empty dashboard when no active campaigns", emptyResult);
		process.exit(1);
	}

	console.log("✅ no active campaigns → empty dashboard");

	const result = await listDashboard.execute({ tenantId, referenceDate });
	if (result.timezone !== timezone) {
		console.error("❌ unexpected timezone", result.timezone);
		process.exit(1);
	}

	if (result.campaigns.length !== 1) {
		console.error("❌ expected one active campaign row", result.campaigns);
		process.exit(1);
	}

	const row = result.campaigns[0];
	if (row.stampTypeLabel !== "Café") {
		console.error("❌ expected stamp type label Café", row);
		process.exit(1);
	}

	if (
		row.scans.today !== 2 ||
		row.scans.yesterday !== 1 ||
		row.scans.last7Days !== 5 ||
		row.scans.sinceStart !== 5
	) {
		console.error("❌ unexpected scan counts", row.scans);
		process.exit(1);
	}

	console.log("✅ active campaign scan windows aggregated");

	const suspendedTenant = Tenant.fromPrimitives({
		...baseTenant.toPrimitives(),
		status: TenantStatus.Suspended,
	});

	const suspendedDashboard = new ListStampCampaignDashboard(
		new StubTenantRepository(suspendedTenant),
		new InMemoryStampCampaignRepository([activeCampaign]),
		new InMemoryStampCampaignScanStatsRepository(scans),
		new InMemoryStampTypeRepository([cafeType]),
	);

	try {
		await suspendedDashboard.execute({ tenantId, referenceDate });
		console.error("❌ expected TenantAccessSuspended");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof TenantAccessSuspended)) {
			console.error("❌ wrong error for suspended tenant", error);
			process.exit(1);
		}
	}

	console.log("✅ suspended tenant → TenantAccessSuspended");

	const missingTenantDashboard = new ListStampCampaignDashboard(
		new StubTenantRepository(null),
		new InMemoryStampCampaignRepository([activeCampaign]),
		new InMemoryStampCampaignScanStatsRepository(scans),
		new InMemoryStampTypeRepository([cafeType]),
	);

	try {
		await missingTenantDashboard.execute({ tenantId, referenceDate });
		console.error("❌ expected TenantNotFound");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof TenantNotFound)) {
			console.error("❌ wrong error for missing tenant", error);
			process.exit(1);
		}
	}

	console.log("✅ missing tenant → TenantNotFound");
	console.log("✅ verify:stamp-campaign-dashboard-use-case passed");
}

void main();
