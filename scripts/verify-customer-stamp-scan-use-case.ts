/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { RecordCustomerVisitByQr } from "../src/contexts/loyalty/customers/application/scan/RecordCustomerVisitByQr";
import { UserRepository } from "../src/contexts/identity/users/domain/UserRepository";
import { Customer } from "../src/contexts/loyalty/customers/domain/Customer";
import { CustomerRepository } from "../src/contexts/loyalty/customers/domain/CustomerRepository";
import { LoyaltyTransaction } from "../src/contexts/loyalty/loyalty_transactions/domain/LoyaltyTransaction";
import { LoyaltyTransactionRepository } from "../src/contexts/loyalty/loyalty_transactions/domain/LoyaltyTransactionRepository";
import { CustomerStampProgress } from "../src/contexts/loyalty/stamp_campaigns/domain/CustomerStampProgress";
import { StampCampaign } from "../src/contexts/loyalty/stamp_campaigns/domain/StampCampaign";
import { StampCampaignRepository } from "../src/contexts/loyalty/stamp_campaigns/domain/StampCampaignRepository";
import { Tenant } from "../src/contexts/tenants/tenants/domain/Tenant";
import { TenantRepository } from "../src/contexts/tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../src/contexts/tenants/tenants/domain/TenantStatus";

const tenantId = "00000000-0000-4000-8000-0000000000d1";
const staffUserId = "00000000-0000-4000-8000-0000000000d2";

const baseTenant = Tenant.fromPrimitives({
	id: tenantId,
	name: "Stamp Scan Verify Cafe",
	slug: "stamp-scan-verify-cafe",
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

class InMemoryCustomerRepository extends CustomerRepository {
	private customers = new Map<string, Customer>();

	constructor(initial: Customer[]) {
		super();
		for (const customer of initial) {
			this.customers.set(customer.id, customer);
		}
	}

	async save(customer: Customer): Promise<void> {
		this.customers.set(customer.id, customer);
	}

	async searchById(_tenantId: string, _id: string): Promise<Customer | null> {
		return null;
	}

	async searchByQrValue(tenantId: string, qrValue: string): Promise<Customer | null> {
		return (
			Array.from(this.customers.values()).find(
				(customer) => customer.tenantId === tenantId && customer.qrValue === qrValue,
			) ?? null
		);
	}

	async searchByUserIdAndTenantId(userId: string, tenantId: string): Promise<Customer | null> {
		return (
			Array.from(this.customers.values()).find(
				(customer) => customer.userId === userId && customer.tenantId === tenantId,
			) ?? null
		);
	}

	async listWithInteractionByUserId(): Promise<never[]> {
		return [];
	}
}

class InMemoryLoyaltyTransactionRepository extends LoyaltyTransactionRepository {
	readonly saved: LoyaltyTransaction[] = [];

	async save(transaction: LoyaltyTransaction): Promise<void> {
		this.saved.push(transaction);
	}

	async searchById(_tenantId: string, _id: string): Promise<LoyaltyTransaction | null> {
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

	getProgress(customerId: string, campaignId: string): CustomerStampProgress | undefined {
		return this.progress.get(`${customerId}:${campaignId}`);
	}
}

class StubUserRepository extends UserRepository {
	async save(): Promise<void> {}

	async search(): Promise<null> {
		return null;
	}

	async searchByEmail(): Promise<null> {
		return null;
	}

	async searchByQrValue(): Promise<null> {
		return null;
	}

	async updatePasswordHash(): Promise<void> {}

	async isPlatformSuperadmin(): Promise<boolean> {
		return false;
	}
}

async function main(): Promise<void> {
	const customer = Customer.register({
		tenantId,
		name: "Stamp Scan Customer",
	});
	const activeCampaign = StampCampaign.create({
		tenantId,
		name: "10 cafés → 1 gratis",
		requiredStamps: 3,
	});
	const inactiveCampaign = StampCampaign.create({
		tenantId,
		name: "Inactive campaign",
		requiredStamps: 5,
	});
	const deactivated = inactiveCampaign.deactivate();

	const tenantRepository = new StubTenantRepository(baseTenant);
	const customerRepository = new InMemoryCustomerRepository([customer]);
	const loyaltyRepository = new InMemoryLoyaltyTransactionRepository();
	const stampRepository = new InMemoryStampCampaignRepository([activeCampaign, deactivated]);

	const useCase = new RecordCustomerVisitByQr(
		tenantRepository,
		customerRepository,
		new StubUserRepository(),
		loyaltyRepository,
		stampRepository,
	);

	const first = await useCase.execute({
		tenantId,
		qrValue: customer.qrValue,
		createdByUserId: staffUserId,
	});

	if (first.stampsAdded.length !== 1 || first.stampsAdded[0]?.current !== 1) {
		console.error("❌ first scan stampsAdded", first.stampsAdded);
		process.exit(1);
	}

	const progressAfterFirst = stampRepository.getProgress(customer.id, activeCampaign.id);
	if (!progressAfterFirst || progressAfterFirst.currentStamps !== 1 || progressAfterFirst.completed) {
		console.error("❌ progress after first scan", progressAfterFirst?.toPrimitives());
		process.exit(1);
	}

	const stampTxCount = loyaltyRepository.saved.filter((tx) => tx.type === "stamp_added").length;
	if (stampTxCount !== 1) {
		console.error("❌ expected 1 stamp_added transaction, got", stampTxCount);
		process.exit(1);
	}

	console.log("✅ first scan adds stamp 1/3");

	await useCase.execute({
		tenantId,
		qrValue: customer.qrValue,
		createdByUserId: staffUserId,
	});
	await useCase.execute({
		tenantId,
		qrValue: customer.qrValue,
		createdByUserId: staffUserId,
	});

	const progressCompleted = stampRepository.getProgress(customer.id, activeCampaign.id);
	if (
		!progressCompleted ||
		progressCompleted.currentStamps !== 3 ||
		!progressCompleted.completed
	) {
		console.error("❌ progress after completing campaign", progressCompleted?.toPrimitives());
		process.exit(1);
	}

	console.log("✅ scans reach completed at required_stamps");

	const afterCompleted = await useCase.execute({
		tenantId,
		qrValue: customer.qrValue,
		createdByUserId: staffUserId,
	});

	if (afterCompleted.stampsAdded.length !== 0) {
		console.error("❌ completed campaign should not add stamps", afterCompleted.stampsAdded);
		process.exit(1);
	}

	const stampTxAfterCompleted = loyaltyRepository.saved.filter((tx) => tx.type === "stamp_added").length;
	if (stampTxAfterCompleted !== 3) {
		console.error("❌ expected 3 stamp_added rows total, got", stampTxAfterCompleted);
		process.exit(1);
	}

	console.log("✅ completed campaign does not add more stamps");

	const inactiveProgress = stampRepository.getProgress(customer.id, deactivated.id);
	if (inactiveProgress) {
		console.error("❌ inactive campaign should not have progress", inactiveProgress.toPrimitives());
		process.exit(1);
	}

	console.log("✅ inactive campaign ignored");
	console.log("✅ verify:customer-stamp-scan-use-case passed");
}

void main();
