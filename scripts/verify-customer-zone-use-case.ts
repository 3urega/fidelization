/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { GetTenantCustomerDetail } from "../src/contexts/loyalty/customers/application/analytics/GetTenantCustomerDetail";
import { GetTenantCustomerInsights } from "../src/contexts/loyalty/customers/application/analytics/GetTenantCustomerInsights";
import { ListTenantCustomersBySegment } from "../src/contexts/loyalty/customers/application/analytics/ListTenantCustomersBySegment";
import type { CustomerActivityRow, CustomerRedeemedRewardRow } from "../src/contexts/loyalty/customers/domain/analytics/CustomerDetail";
import type { CustomerAnalyticsRawRow } from "../src/contexts/loyalty/customers/domain/analytics/CustomerAnalyticsRawRow";
import {
	AT_RISK_SEGMENT_MIN_DAYS,
	BADGE_ACTIVE_MAX_DAYS,
	BADGE_INACTIVE_MIN_DAYS,
	CustomerEngagementClassifier,
	FEATURED_TOP_N,
} from "../src/contexts/loyalty/customers/domain/analytics/CustomerEngagementClassifier";
import type { CustomerNearRewardProgress } from "../src/contexts/loyalty/customers/domain/analytics/CustomerNearRewardProgress";
import { CustomerZoneForbidden } from "../src/contexts/loyalty/customers/domain/analytics/CustomerZoneForbidden";
import {
	LoadCustomerAnalyticsSnapshotParams,
	TenantCustomerAnalyticsRepository,
} from "../src/contexts/loyalty/customers/domain/analytics/TenantCustomerAnalyticsRepository";
import { GetCustomerStampProgress } from "../src/contexts/loyalty/customers/application/profile/GetCustomerStampProgress";
import { StampCampaign } from "../src/contexts/loyalty/stamp_campaigns/domain/StampCampaign";
import { StampCampaignRepository } from "../src/contexts/loyalty/stamp_campaigns/domain/StampCampaignRepository";
import { CustomerStampProgress } from "../src/contexts/loyalty/stamp_campaigns/domain/CustomerStampProgress";
import { StampType } from "../src/contexts/loyalty/stamp_types/domain/StampType";
import { StampTypeRepository } from "../src/contexts/loyalty/stamp_types/domain/StampTypeRepository";
import { TenantRole } from "../src/contexts/tenants/memberships/domain/TenantRole";
import { TenantAccessSuspended } from "../src/contexts/tenants/tenants/domain/TenantAccessSuspended";
import { Tenant } from "../src/contexts/tenants/tenants/domain/Tenant";
import { TenantNotFound } from "../src/contexts/tenants/tenants/domain/TenantNotFound";
import { TenantRepository } from "../src/contexts/tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../src/contexts/tenants/tenants/domain/TenantStatus";

const tenantId = "00000000-0000-4000-8000-0000000000c1";
const referenceDate = new Date("2026-06-11T15:00:00.000Z");
const timezone = "Europe/Madrid";

const customerAna = "00000000-0000-4000-8000-0000000000a1";
const customerPedro = "00000000-0000-4000-8000-0000000000a2";
const customerMarta = "00000000-0000-4000-8000-0000000000a3";
const customerCarlos = "00000000-0000-4000-8000-0000000000a4";
const customerDavid = "00000000-0000-4000-8000-0000000000a5";
const customerLucia = "00000000-0000-4000-8000-0000000000a6";
const campaignCoffeeId = "00000000-0000-4000-8000-0000000000b1";
const cafeTypeId = "00000000-0000-4000-8000-0000000000t1";

const baseTenant = Tenant.fromPrimitives({
	id: tenantId,
	name: "Customer Zone Verify Cafe",
	slug: "customer-zone-verify",
	logoUrl: "",
	primaryColor: "#7C3AED",
	secondaryColor: "#4F46E5",
	subscriptionPlan: "FREE",
	subscriptionPlanId: null,
	status: TenantStatus.Active,
	createdAt: new Date().toISOString(),
});

const nearRewardAna: CustomerNearRewardProgress = {
	campaignId: campaignCoffeeId,
	campaignName: "10 cafés gratis",
	current: 9,
	required: 10,
};

const nearRewardDavid: CustomerNearRewardProgress = {
	campaignId: campaignCoffeeId,
	campaignName: "8 croissants",
	current: 7,
	required: 8,
};

const snapshotRows: CustomerAnalyticsRawRow[] = [
	{
		customerId: customerAna,
		name: "Ana García",
		email: "ana@example.com",
		phone: null,
		createdAt: new Date("2025-03-01T10:00:00.000Z"),
		visitsCount: 43,
		pointsBalance: 43,
		lastVisitAt: new Date("2026-06-09T10:00:00.000Z"),
		visitsThisMonth: 12,
		totalStamps: 84,
		rewardsRedeemedCount: 1,
		nearRewardCampaigns: [],
	},
	{
		customerId: customerPedro,
		name: "Pedro López",
		email: null,
		phone: null,
		createdAt: new Date("2025-01-15T10:00:00.000Z"),
		visitsCount: 20,
		pointsBalance: 20,
		lastVisitAt: new Date("2026-06-11T09:00:00.000Z"),
		visitsThisMonth: 8,
		totalStamps: 30,
		rewardsRedeemedCount: 0,
		nearRewardCampaigns: [],
	},
	{
		customerId: customerMarta,
		name: "Marta Ruiz",
		email: null,
		phone: null,
		createdAt: new Date("2024-11-01T10:00:00.000Z"),
		visitsCount: 15,
		pointsBalance: 15,
		lastVisitAt: new Date("2026-05-14T10:00:00.000Z"),
		visitsThisMonth: 0,
		totalStamps: 10,
		rewardsRedeemedCount: 0,
		nearRewardCampaigns: [],
	},
	{
		customerId: customerCarlos,
		name: "Carlos Díaz",
		email: null,
		phone: null,
		createdAt: new Date("2024-06-01T10:00:00.000Z"),
		visitsCount: 8,
		pointsBalance: 8,
		lastVisitAt: new Date("2026-04-22T10:00:00.000Z"),
		visitsThisMonth: 0,
		totalStamps: 5,
		rewardsRedeemedCount: 0,
		nearRewardCampaigns: [],
	},
	{
		customerId: customerDavid,
		name: "David Serra",
		email: null,
		phone: null,
		createdAt: new Date("2025-08-01T10:00:00.000Z"),
		visitsCount: 12,
		pointsBalance: 12,
		lastVisitAt: new Date("2026-06-06T10:00:00.000Z"),
		visitsThisMonth: 3,
		totalStamps: 7,
		rewardsRedeemedCount: 0,
		nearRewardCampaigns: [],
	},
	{
		customerId: customerLucia,
		name: "Lucía Nuevo",
		email: null,
		phone: null,
		createdAt: new Date("2026-06-05T10:00:00.000Z"),
		visitsCount: 0,
		pointsBalance: 0,
		lastVisitAt: null,
		visitsThisMonth: 0,
		totalStamps: 0,
		rewardsRedeemedCount: 0,
		nearRewardCampaigns: [],
	},
];

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

class InMemoryTenantCustomerAnalyticsRepository extends TenantCustomerAnalyticsRepository {
	constructor(
		private readonly rows: CustomerAnalyticsRawRow[],
		private readonly nearRewardByCustomerId: Map<string, CustomerNearRewardProgress[]>,
		private readonly activityByCustomerId: Map<string, CustomerActivityRow[]>,
		private readonly redeemedByCustomerId: Map<string, CustomerRedeemedRewardRow[]>,
	) {
		super();
	}

	async loadSnapshot(_params: LoadCustomerAnalyticsSnapshotParams): Promise<CustomerAnalyticsRawRow[]> {
		return this.rows.map((row) => ({ ...row, nearRewardCampaigns: [] }));
	}

	async loadNearRewardByTenant(_tenantId: string): Promise<Map<string, CustomerNearRewardProgress[]>> {
		return this.nearRewardByCustomerId;
	}

	async findCustomerBase(
		_tenantId: string,
		customerId: string,
	): Promise<CustomerAnalyticsRawRow | null> {
		return this.rows.find((row) => row.customerId === customerId) ?? null;
	}

	async loadRecentActivity(
		_tenantId: string,
		customerId: string,
		_limit: number,
	): Promise<CustomerActivityRow[]> {
		return this.activityByCustomerId.get(customerId) ?? [];
	}

	async loadRewardsRedeemed(
		_tenantId: string,
		customerId: string,
	): Promise<CustomerRedeemedRewardRow[]> {
		return this.redeemedByCustomerId.get(customerId) ?? [];
	}
}

class InMemoryStampCampaignRepository extends StampCampaignRepository {
	constructor(
		private readonly campaigns: StampCampaign[],
		private readonly progress: CustomerStampProgress[],
	) {
		super();
	}

	async saveCampaign(): Promise<void> {}

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

	async searchProgress(
		tenantId: string,
		customerId: string,
		campaignId: string,
	): Promise<CustomerStampProgress | null> {
		return (
			this.progress.find(
				(item) =>
					item.tenantId === tenantId &&
					item.customerId === customerId &&
					item.campaignId === campaignId,
			) ?? null
		);
	}

	async hasActiveGenericCampaigns(): Promise<boolean> {
		return false;
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

function assert(condition: boolean, message: string): void {
	if (!condition) {
		console.error(`❌ ${message}`);
		process.exit(1);
	}
}

async function main(): Promise<void> {
	const nearRewardByCustomerId = new Map<string, CustomerNearRewardProgress[]>([
		[customerAna, [nearRewardAna]],
		[customerDavid, [nearRewardDavid]],
	]);
	const activityByCustomerId = new Map<string, CustomerActivityRow[]>([
		[
			customerAna,
			[
				{ occurredAt: new Date("2026-06-01T10:00:00.000Z"), label: "Café especial" },
				{ occurredAt: new Date("2026-05-29T10:00:00.000Z"), label: "Matcha Latte" },
			],
		],
	]);
	const redeemedByCustomerId = new Map<string, CustomerRedeemedRewardRow[]>([
		[
			customerAna,
			[{ rewardName: "Café gratis", redeemedAt: new Date("2026-04-12T10:00:00.000Z") }],
		],
	]);

	const analyticsRepository = new InMemoryTenantCustomerAnalyticsRepository(
		snapshotRows,
		nearRewardByCustomerId,
		activityByCustomerId,
		redeemedByCustomerId,
	);
	const tenantRepository = new StubTenantRepository(baseTenant);

	const cafeType = StampType.fromPrimitives({
		id: cafeTypeId,
		tenantId,
		label: "Café",
		slug: "cafe",
		sortOrder: 0,
		isActive: true,
	});
	const coffeeCampaign = StampCampaign.fromPrimitives({
		...StampCampaign.create({
			tenantId,
			name: "10 cafés gratis",
			requiredStamps: 10,
			stampTypeId: cafeTypeId,
		}).toPrimitives(),
		id: campaignCoffeeId,
	});
	const stampProgress = CustomerStampProgress.fromPrimitives({
		id: "00000000-0000-4000-8000-0000000000p1",
		tenantId,
		customerId: customerAna,
		campaignId: campaignCoffeeId,
		currentStamps: 9,
		completed: false,
	});

	const getCustomerStampProgress = new GetCustomerStampProgress(
		tenantRepository,
		new InMemoryStampCampaignRepository([coffeeCampaign], [stampProgress]),
		new InMemoryStampTypeRepository([cafeType]),
	);

	const getInsights = new GetTenantCustomerInsights(tenantRepository, analyticsRepository);
	const listBySegment = new ListTenantCustomersBySegment(tenantRepository, analyticsRepository);
	const getDetail = new GetTenantCustomerDetail(
		tenantRepository,
		analyticsRepository,
		getCustomerStampProgress,
	);

	const anaDays = CustomerEngagementClassifier.daysSinceLastVisit(
		new Date("2026-06-09T10:00:00.000Z"),
		referenceDate,
		timezone,
	);
	assert(anaDays === 2, `expected Ana daysSince=2, got ${anaDays}`);
	assert(
		CustomerEngagementClassifier.resolveBadgeStatus(true, anaDays) === "vip",
		"featured client should badge vip",
	);
	assert(
		CustomerEngagementClassifier.resolveBadgeStatus(false, 10) === "active",
		"10 days should badge active",
	);
	assert(
		CustomerEngagementClassifier.resolveBadgeStatus(false, BADGE_ACTIVE_MAX_DAYS) === "active",
		"13 days should badge active",
	);
	assert(
		CustomerEngagementClassifier.resolveBadgeStatus(false, BADGE_ACTIVE_MAX_DAYS + 1) === "at_risk",
		"14 days should badge at_risk",
	);
	assert(
		CustomerEngagementClassifier.resolveBadgeStatus(false, BADGE_INACTIVE_MIN_DAYS) === "inactive",
		"45 days should badge inactive",
	);
	assert(
		CustomerEngagementClassifier.isAtRiskSegment(AT_RISK_SEGMENT_MIN_DAYS - 1) === false,
		"20 days should not be at_risk segment",
	);
	assert(
		CustomerEngagementClassifier.isAtRiskSegment(AT_RISK_SEGMENT_MIN_DAYS) === true,
		"21 days should be at_risk segment",
	);

	const featuredIds = CustomerEngagementClassifier.resolveFeaturedCustomerIds(snapshotRows);
	assert(featuredIds.size === 3, `expected 3 featured ids, got ${featuredIds.size}`);
	assert(featuredIds.has(customerAna), "Ana should be featured");
	assert(featuredIds.has(customerPedro), "Pedro should be featured");
	assert(featuredIds.has(customerDavid), "David should be featured with 3 visits");

	const paddedFeaturedRows = Array.from({ length: FEATURED_TOP_N + 2 }, (_, index) => ({
		...snapshotRows[0],
		customerId: `00000000-0000-4000-8000-00000000${String(index).padStart(2, "0")}`,
		name: `Cliente ${index}`,
		visitsThisMonth: FEATURED_TOP_N + 2 - index,
		nearRewardCampaigns: [],
	}));
	const topFeatured = CustomerEngagementClassifier.resolveFeaturedCustomerIds(paddedFeaturedRows);
	assert(topFeatured.size === FEATURED_TOP_N, `expected top ${FEATURED_TOP_N}, got ${topFeatured.size}`);

	console.log("✅ CustomerEngagementClassifier thresholds and featured ranking");

	const insights = await getInsights.execute({
		tenantId,
		role: TenantRole.Owner,
		referenceDate,
	});
	assert(insights.vipCount === 3, `expected vipCount=3, got ${insights.vipCount}`);
	assert(insights.atRiskCount === 3, `expected atRiskCount=3, got ${insights.atRiskCount}`);
	assert(
		insights.nearRewardCount === 2,
		`expected nearRewardCount=2, got ${insights.nearRewardCount}`,
	);
	assert(insights.newThisMonthCount === 1, `expected newThisMonthCount=1, got ${insights.newThisMonthCount}`);
	assert(insights.timezone.length > 0, "expected timezone in insights");

	console.log("✅ GetTenantCustomerInsights aggregates");

	const featured = await listBySegment.execute({
		tenantId,
		role: TenantRole.Owner,
		segment: "featured",
		referenceDate,
	});
	assert(featured.customers.length === 3, `expected 3 featured customers, got ${featured.customers.length}`);
	assert(featured.customers[0]?.name === "Ana García", "Ana should rank first featured");

	const atRisk = await listBySegment.execute({
		tenantId,
		role: TenantRole.Owner,
		segment: "at_risk",
		referenceDate,
	});
	assert(atRisk.customers.length === 3, `expected 3 at_risk customers, got ${atRisk.customers.length}`);

	const nearReward = await listBySegment.execute({
		tenantId,
		role: TenantRole.Owner,
		segment: "near_reward",
		referenceDate,
	});
	assert(nearReward.customers.length === 2, `expected 2 near_reward customers, got ${nearReward.customers.length}`);
	assert(nearReward.customers[0]?.nearReward?.current === 9, "Ana should rank first near reward");

	const allCustomers = await listBySegment.execute({
		tenantId,
		role: TenantRole.Owner,
		segment: "all",
		referenceDate,
	});
	assert(allCustomers.customers.length === 6, `expected 6 all customers, got ${allCustomers.customers.length}`);

	console.log("✅ ListTenantCustomersBySegment filters segments");

	const detail = await getDetail.execute({
		tenantId,
		customerId: customerAna,
		role: TenantRole.Owner,
		referenceDate,
	});
	assert(detail.status === "vip", `expected detail status vip, got ${detail.status}`);
	assert(detail.stampProgress.length === 1, "expected one stamp progress row");
	assert(detail.recentActivity.length === 2, "expected two activity rows");
	assert(detail.rewardsRedeemed.length === 1, "expected one redeemed reward");

	console.log("✅ GetTenantCustomerDetail composes snapshot + progress + activity");

	try {
		await getInsights.execute({
			tenantId,
			role: TenantRole.Employee,
			referenceDate,
		});
		console.error("❌ expected CustomerZoneForbidden for employee");
		process.exit(1);
	} catch (error) {
		assert(error instanceof CustomerZoneForbidden, "employee should throw CustomerZoneForbidden");
	}

	console.log("✅ employee role → CustomerZoneForbidden");

	const suspendedInsights = new GetTenantCustomerInsights(
		new StubTenantRepository(
			Tenant.fromPrimitives({
				...baseTenant.toPrimitives(),
				status: TenantStatus.Suspended,
			}),
		),
		analyticsRepository,
	);

	try {
		await suspendedInsights.execute({
			tenantId,
			role: TenantRole.Owner,
			referenceDate,
		});
		console.error("❌ expected TenantAccessSuspended");
		process.exit(1);
	} catch (error) {
		assert(error instanceof TenantAccessSuspended, "suspended tenant should throw TenantAccessSuspended");
	}

	console.log("✅ suspended tenant → TenantAccessSuspended");

	const missingTenantInsights = new GetTenantCustomerInsights(
		new StubTenantRepository(null),
		analyticsRepository,
	);

	try {
		await missingTenantInsights.execute({
			tenantId,
			role: TenantRole.Owner,
			referenceDate,
		});
		console.error("❌ expected TenantNotFound");
		process.exit(1);
	} catch (error) {
		assert(error instanceof TenantNotFound, "missing tenant should throw TenantNotFound");
	}

	console.log("✅ missing tenant → TenantNotFound");
	console.log("✅ verify:customer-zone-use-case passed");
}

main().catch((error) => {
	console.error("❌ verify:customer-zone-use-case failed", error);
	process.exit(1);
});
