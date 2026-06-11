/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { GetCustomerStampProgress } from "../src/contexts/loyalty/customers/application/profile/GetCustomerStampProgress";
import { GENERIC_STAMP_VISIT_LABEL } from "../src/contexts/loyalty/stamp_types/domain/StampType";
import { StampType } from "../src/contexts/loyalty/stamp_types/domain/StampType";
import { StampTypeRepository } from "../src/contexts/loyalty/stamp_types/domain/StampTypeRepository";
import { Customer } from "../src/contexts/loyalty/customers/domain/Customer";
import { CustomerStampProgress } from "../src/contexts/loyalty/stamp_campaigns/domain/CustomerStampProgress";
import { StampCampaign } from "../src/contexts/loyalty/stamp_campaigns/domain/StampCampaign";
import { StampCampaignRepository } from "../src/contexts/loyalty/stamp_campaigns/domain/StampCampaignRepository";
import { Tenant } from "../src/contexts/tenants/tenants/domain/Tenant";
import { TenantRepository } from "../src/contexts/tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../src/contexts/tenants/tenants/domain/TenantStatus";

const tenantId = "00000000-0000-4000-8000-0000000000d1";

const baseTenant = Tenant.fromPrimitives({
	id: tenantId,
	name: "Stamp Progress Verify Cafe",
	slug: "stamp-progress-verify-cafe",
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
	private campaigns = new Map<string, StampCampaign>();
	private progress = new Map<string, CustomerStampProgress>();

	constructor(campaigns: StampCampaign[]) {
		super();
		for (const campaign of campaigns) {
			this.campaigns.set(campaign.id, campaign);
		}
	}

	async saveCampaign(campaign: StampCampaign): Promise<void> {
		this.campaigns.set(campaign.id, campaign);
	}

	async searchCampaignById(tenantId: string, id: string): Promise<StampCampaign | null> {
		const campaign = this.campaigns.get(id);

		return campaign && campaign.tenantId === tenantId ? campaign : null;
	}

	async listByTenant(tenantId: string): Promise<StampCampaign[]> {
		return Array.from(this.campaigns.values()).filter((campaign) => campaign.tenantId === tenantId);
	}

	async listActiveByTenant(tenantId: string): Promise<StampCampaign[]> {
		return Array.from(this.campaigns.values()).filter(
			(campaign) => campaign.tenantId === tenantId && campaign.isActive,
		);
	}

	async saveProgress(progress: CustomerStampProgress): Promise<void> {
		this.progress.set(`${progress.customerId}:${progress.campaignId}`, progress);
	}

	async searchProgress(
		tenantId: string,
		customerId: string,
		campaignId: string,
	): Promise<CustomerStampProgress | null> {
		const row = this.progress.get(`${customerId}:${campaignId}`);

		return row && row.tenantId === tenantId ? row : null;
	}

	async hasActiveGenericCampaigns(tenantId: string): Promise<boolean> {
		return Array.from(this.campaigns.values()).some(
			(campaign) =>
				campaign.tenantId === tenantId &&
				campaign.isActive &&
				campaign.stampTypeId === null,
		);
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

	async countActiveByTenant(tenantId: string): Promise<number> {
		return (await this.listActiveByTenant(tenantId)).length;
	}

	async maxSortOrder(): Promise<number> {
		return 0;
	}
}

async function main(): Promise<void> {
	const customer = Customer.register({
		tenantId,
		name: "Stamp Progress Customer",
	});
	const activeCampaign = StampCampaign.create({
		tenantId,
		name: "3 cafés → 1 gratis",
		requiredStamps: 3,
		stampTypeId: null,
	});
	const inactiveCampaign = StampCampaign.create({
		tenantId,
		name: "Inactive campaign",
		requiredStamps: 5,
	});
	const deactivated = inactiveCampaign.deactivate();

	const tenantRepository = new StubTenantRepository(baseTenant);
	const stampRepository = new InMemoryStampCampaignRepository([activeCampaign, deactivated]);
	const stampTypeRepository = new InMemoryStampTypeRepository([]);
	const useCase = new GetCustomerStampProgress(
		tenantRepository,
		stampRepository,
		stampTypeRepository,
	);

	const beforeScan = await useCase.execute({
		tenantId,
		customerId: customer.id,
	});

	if (
		beforeScan.length !== 1 ||
		beforeScan[0]?.campaignId !== activeCampaign.id ||
		beforeScan[0]?.current !== 0 ||
		beforeScan[0]?.required !== 3 ||
		beforeScan[0]?.stampTypeLabel !== GENERIC_STAMP_VISIT_LABEL ||
		beforeScan[0]?.completed
	) {
		console.error("❌ active campaign without progress should be 0/N", beforeScan);
		process.exit(1);
	}

	console.log("✅ active campaign returns 0/N without scans");

	const cafeType = StampType.create({
		tenantId,
		label: "Café",
		slug: "cafe",
		sortOrder: 1,
	});
	const typedCampaign = StampCampaign.create({
		tenantId,
		name: "10 cafés",
		requiredStamps: 10,
		stampTypeId: cafeType.id,
	});
	const typedRepo = new InMemoryStampCampaignRepository([typedCampaign]);
	const typedTypeRepo = new InMemoryStampTypeRepository([cafeType]);
	const typedUseCase = new GetCustomerStampProgress(
		tenantRepository,
		typedRepo,
		typedTypeRepo,
	);
	const typedProgress = await typedUseCase.execute({ tenantId, customerId: customer.id });

	if (typedProgress[0]?.stampTypeLabel !== "Café") {
		console.error("❌ typed campaign should include stampTypeLabel", typedProgress);
		process.exit(1);
	}

	console.log("✅ typed campaign includes stampTypeLabel");

	const partialProgress = CustomerStampProgress.fromPrimitives({
		id: "progress-partial",
		tenantId,
		customerId: customer.id,
		campaignId: activeCampaign.id,
		currentStamps: 2,
		completed: false,
	});
	await stampRepository.saveProgress(partialProgress);

	const afterPartial = await useCase.execute({
		tenantId,
		customerId: customer.id,
	});

	if (afterPartial.length !== 1 || afterPartial[0]?.current !== 2 || afterPartial[0]?.completed) {
		console.error("❌ partial progress should be 2/3", afterPartial);
		process.exit(1);
	}

	console.log("✅ returns saved progress current/required");

	const completedProgress = CustomerStampProgress.fromPrimitives({
		id: "progress-completed",
		tenantId,
		customerId: customer.id,
		campaignId: activeCampaign.id,
		currentStamps: 3,
		completed: true,
	});
	await stampRepository.saveProgress(completedProgress);

	const afterCompleted = await useCase.execute({
		tenantId,
		customerId: customer.id,
	});

	if (
		afterCompleted.length !== 1 ||
		afterCompleted[0]?.current !== 3 ||
		!afterCompleted[0]?.completed
	) {
		console.error("❌ completed campaign should show completed=true", afterCompleted);
		process.exit(1);
	}

	console.log("✅ completed campaign returns completed=true");

	const inactiveOnly = StampCampaign.create({
		tenantId,
		name: "Only inactive",
		requiredStamps: 4,
	});
	const inactiveOnlyRepo = new InMemoryStampCampaignRepository([inactiveOnly.deactivate()]);
	const inactiveUseCase = new GetCustomerStampProgress(
		tenantRepository,
		inactiveOnlyRepo,
		stampTypeRepository,
	);
	const empty = await inactiveUseCase.execute({ tenantId, customerId: customer.id });

	if (empty.length !== 0) {
		console.error("❌ inactive campaigns should not appear", empty);
		process.exit(1);
	}

	console.log("✅ inactive campaigns excluded");
	console.log("✅ verify:customer-stamp-progress-use-case passed");
}

void main();
