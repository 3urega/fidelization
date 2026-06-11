/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { RecordCustomerVisitByQr } from "../src/contexts/loyalty/customers/application/scan/RecordCustomerVisitByQr";
import { InvalidStampScan } from "../src/contexts/loyalty/customers/domain/InvalidStampScan";
import { UserRepository } from "../src/contexts/identity/users/domain/UserRepository";
import { Customer } from "../src/contexts/loyalty/customers/domain/Customer";
import { CustomerRepository } from "../src/contexts/loyalty/customers/domain/CustomerRepository";
import { LoyaltyTransaction } from "../src/contexts/loyalty/loyalty_transactions/domain/LoyaltyTransaction";
import { LoyaltyTransactionRepository } from "../src/contexts/loyalty/loyalty_transactions/domain/LoyaltyTransactionRepository";
import { ResolveStampScanOptions } from "../src/contexts/loyalty/stamp_types/application/scan/ResolveStampScanOptions";
import { StampType } from "../src/contexts/loyalty/stamp_types/domain/StampType";
import { StampTypeRepository } from "../src/contexts/loyalty/stamp_types/domain/StampTypeRepository";
import { CustomerStampProgress } from "../src/contexts/loyalty/stamp_campaigns/domain/CustomerStampProgress";
import { StampCampaign } from "../src/contexts/loyalty/stamp_campaigns/domain/StampCampaign";
import { StampCampaignRepository } from "../src/contexts/loyalty/stamp_campaigns/domain/StampCampaignRepository";
import { TenantRole } from "../src/contexts/tenants/memberships/domain/TenantRole";
import { Tenant } from "../src/contexts/tenants/tenants/domain/Tenant";
import { TenantRepository } from "../src/contexts/tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../src/contexts/tenants/tenants/domain/TenantStatus";

const tenantId = "00000000-0000-4000-8000-0000000000h3";
const staffUserId = "00000000-0000-4000-8000-0000000000d2";

const baseTenant = Tenant.fromPrimitives({
	id: tenantId,
	name: "Targeted Stamp Scan Cafe",
	slug: "targeted-stamp-scan-cafe",
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

class StubUserRepository extends UserRepository {
	async searchByQrValue(): Promise<null> {
		return null;
	}
}

class InMemoryLoyaltyTransactionRepository extends LoyaltyTransactionRepository {
	saved: LoyaltyTransaction[] = [];

	async save(transaction: LoyaltyTransaction): Promise<void> {
		this.saved.push(transaction);
	}
}

class InMemoryStampTypeRepository extends StampTypeRepository {
	constructor(private readonly types: StampType[]) {
		super();
	}

	async save(): Promise<void> {}

	async searchById(tenantIdValue: string, id: string): Promise<StampType | null> {
		return this.types.find((type) => type.tenantId === tenantIdValue && type.id === id) ?? null;
	}

	async searchBySlug(): Promise<null> {
		return null;
	}

	async listByTenant(tenantIdValue: string): Promise<StampType[]> {
		return this.types.filter((type) => type.tenantId === tenantIdValue);
	}

	async listActiveByTenant(tenantIdValue: string): Promise<StampType[]> {
		return this.types.filter((type) => type.tenantId === tenantIdValue && type.isActive);
	}

	async countActiveByTenant(tenantIdValue: string): Promise<number> {
		return (await this.listActiveByTenant(tenantIdValue)).length;
	}

	async maxSortOrder(): Promise<number> {
		return 0;
	}
}

class InMemoryStampCampaignRepository extends StampCampaignRepository {
	private campaigns: StampCampaign[];
	private progress = new Map<string, CustomerStampProgress>();

	constructor(campaigns: StampCampaign[]) {
		super();
		this.campaigns = campaigns;
	}

	async saveCampaign(): Promise<void> {}

	async searchCampaignById(): Promise<null> {
		return null;
	}

	async listByTenant(): Promise<StampCampaign[]> {
		return this.campaigns;
	}

	async listActiveByTenant(tenantIdValue: string): Promise<StampCampaign[]> {
		return this.campaigns.filter(
			(campaign) => campaign.tenantId === tenantIdValue && campaign.isActive,
		);
	}

	async hasActiveGenericCampaigns(tenantIdValue: string): Promise<boolean> {
		return this.campaigns.some(
			(campaign) =>
				campaign.tenantId === tenantIdValue &&
				campaign.isActive &&
				campaign.stampTypeId === null,
		);
	}

	async saveProgress(progress: CustomerStampProgress): Promise<void> {
		this.progress.set(`${progress.customerId}:${progress.campaignId}`, progress);
	}

	async searchProgress(
		tenantIdValue: string,
		customerId: string,
		campaignId: string,
	): Promise<CustomerStampProgress | null> {
		const row = this.progress.get(`${customerId}:${campaignId}`);

		return row && row.tenantId === tenantIdValue ? row : null;
	}

	getProgress(customerId: string, campaignId: string): CustomerStampProgress | undefined {
		return this.progress.get(`${customerId}:${campaignId}`);
	}
}

class InMemoryCustomerRepository extends CustomerRepository {
	private customers = new Map<string, Customer>();

	constructor(initial: Customer[]) {
		super();
		for (const row of initial) {
			this.customers.set(row.id, row);
		}
	}

	async save(customer: Customer): Promise<void> {
		this.customers.set(customer.id, customer);
	}

	async searchById(): Promise<null> {
		return null;
	}

	async searchByQrValue(tenantIdValue: string, qrValue: string): Promise<Customer | null> {
		return (
			Array.from(this.customers.values()).find(
				(row) => row.tenantId === tenantIdValue && row.qrValue === qrValue,
			) ?? null
		);
	}

	async searchByUserIdAndTenantId(): Promise<null> {
		return null;
	}

	async listWithInteractionByUserId(): Promise<never[]> {
		return [];
	}
}

async function main(): Promise<void> {
	const cafeType = StampType.create({
		tenantId,
		label: "Café",
		slug: "cafe",
		sortOrder: 1,
	});
	const menuType = StampType.create({
		tenantId,
		label: "Menú",
		slug: "menu",
		sortOrder: 2,
	});

	const coffeeCampaign = StampCampaign.create({
		tenantId,
		name: "10 cafés gratis",
		requiredStamps: 10,
		stampTypeId: cafeType.id,
	});
	const menuCampaign = StampCampaign.create({
		tenantId,
		name: "5 menús gratis",
		requiredStamps: 5,
		stampTypeId: menuType.id,
	});
	const generalCampaign = StampCampaign.create({
		tenantId,
		name: "8 visitas fiel",
		requiredStamps: 8,
		stampTypeId: null,
	});

	const customer = Customer.register({
		tenantId,
		name: "Targeted Scan Customer",
	});

	const tenantRepository = new StubTenantRepository(baseTenant);
	const stampTypeRepository = new InMemoryStampTypeRepository([cafeType, menuType]);
	const stampRepository = new InMemoryStampCampaignRepository([
		coffeeCampaign,
		menuCampaign,
		generalCampaign,
	]);
	const customerRepository = new InMemoryCustomerRepository([customer]);
	const loyaltyRepository = new InMemoryLoyaltyTransactionRepository();
	const resolveStampScanOptions = new ResolveStampScanOptions(
		tenantRepository,
		stampTypeRepository,
		stampRepository,
	);

	const useCase = new RecordCustomerVisitByQr(
		tenantRepository,
		customerRepository,
		new StubUserRepository(),
		loyaltyRepository,
		stampRepository,
		stampTypeRepository,
		resolveStampScanOptions,
	);

	try {
		await useCase.execute({
			tenantId,
			qrValue: customer.qrValue,
			createdByUserId: staffUserId,
			staffRole: TenantRole.Owner,
		});
		console.error("❌ expected InvalidStampScan when stampTypeId omitted");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof InvalidStampScan)) {
			console.error("❌ wrong error when stampTypeId omitted", error);
			process.exit(1);
		}
	}

	console.log("✅ missing stampTypeId → InvalidStampScan");

	for (let i = 1; i <= 3; i += 1) {
		const result = await useCase.execute({
			tenantId,
			qrValue: customer.qrValue,
			createdByUserId: staffUserId,
			staffRole: TenantRole.Owner,
			stampTypeId: cafeType.id,
		});

		if (
			result.stampsAdded.length !== 1 ||
			result.stampsAdded[0]?.campaignId !== coffeeCampaign.id ||
			result.stampsAdded[0]?.current !== i
		) {
			console.error(`❌ café scan ${i}`, result.stampsAdded);
			process.exit(1);
		}
	}

	const menuProgressBefore = stampRepository.getProgress(customer.id, menuCampaign.id);
	if (menuProgressBefore) {
		console.error("❌ menú progress should not exist after café scans", menuProgressBefore);
		process.exit(1);
	}

	console.log("✅ café scans only advance coffee campaign");

	for (let i = 1; i <= 2; i += 1) {
		const result = await useCase.execute({
			tenantId,
			qrValue: customer.qrValue,
			createdByUserId: staffUserId,
			staffRole: TenantRole.Owner,
			stampTypeId: menuType.id,
		});

		if (
			result.stampsAdded.length !== 1 ||
			result.stampsAdded[0]?.campaignId !== menuCampaign.id ||
			result.stampsAdded[0]?.current !== i
		) {
			console.error(`❌ menú scan ${i}`, result.stampsAdded);
			process.exit(1);
		}
	}

	console.log("✅ menú scans only advance menu campaign");

	const general = await useCase.execute({
		tenantId,
		qrValue: customer.qrValue,
		createdByUserId: staffUserId,
		staffRole: TenantRole.Owner,
		stampTypeId: null,
	});

	if (
		general.stampsAdded.length !== 1 ||
		general.stampsAdded[0]?.campaignId !== generalCampaign.id ||
		general.stampsAdded[0]?.current !== 1
	) {
		console.error("❌ general scan", general.stampsAdded);
		process.exit(1);
	}

	console.log("✅ Visita general only advances generic campaign");
	console.log("✅ verify:customer-stamp-scan-targeted-use-case passed");
}

void main();
