/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { AssertTenantPlanFeature } from "../src/contexts/billing/subscriptions/application/guard/AssertTenantPlanFeature";
import { ResolveTenantSubscriptionPlan } from "../src/contexts/billing/subscriptions/application/resolve/ResolveTenantSubscriptionPlan";
import { TenantBillingRepository } from "../src/contexts/billing/subscriptions/domain/TenantBillingRepository";
import { UserRepository } from "../src/contexts/identity/users/domain/UserRepository";
import { RecordStaffScanByTarget } from "../src/contexts/loyalty/customers/application/scan/RecordStaffScanByTarget";
import { ResolveCustomerByQrForStaffScan } from "../src/contexts/loyalty/customers/application/scan/ResolveCustomerByQrForStaffScan";
import { Customer } from "../src/contexts/loyalty/customers/domain/Customer";
import { CustomerRepository } from "../src/contexts/loyalty/customers/domain/CustomerRepository";
import { InvalidStampScan } from "../src/contexts/loyalty/customers/domain/InvalidStampScan";
import type { StaffScanOutcome } from "../src/contexts/loyalty/customers/domain/StaffScanOutcome";
import { LoyaltyTransaction } from "../src/contexts/loyalty/loyalty_transactions/domain/LoyaltyTransaction";
import { LoyaltyTransactionRepository } from "../src/contexts/loyalty/loyalty_transactions/domain/LoyaltyTransactionRepository";
import { CustomerPromotionUsageRepository } from "../src/contexts/loyalty/promotions/domain/CustomerPromotionUsageRepository";
import { PromotionRepository } from "../src/contexts/loyalty/promotions/domain/PromotionRepository";
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

class StubTenantBillingRepository extends TenantBillingRepository {
	async savePlan(): Promise<void> {}

	async searchPlanByName(): Promise<null> {
		return null;
	}

	async searchPlanById(): Promise<null> {
		return null;
	}

	async listActivePlans(): Promise<never[]> {
		return [];
	}

	async saveSubscription(): Promise<void> {}

	async searchActiveSubscription(): Promise<null> {
		return null;
	}

	async searchSubscriptionByStripeId(): Promise<null> {
		return null;
	}

	async updateSubscriptionStatus(): Promise<void> {}

	async linkTenantPlan(): Promise<void> {}
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

class InMemoryStampCampaignRepository extends StampCampaignRepository {
	private campaigns: StampCampaign[];
	private progress = new Map<string, CustomerStampProgress>();

	constructor(campaigns: StampCampaign[]) {
		super();
		this.campaigns = campaigns;
	}

	async saveCampaign(): Promise<void> {}

	async deleteCampaign(): Promise<void> {}

	async searchCampaignById(tenantIdValue: string, id: string): Promise<StampCampaign | null> {
		const campaign = this.campaigns.find((row) => row.id === id);

		return campaign && campaign.tenantId === tenantIdValue ? campaign : null;
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

class StubPromotionRepository extends PromotionRepository {
	async save(): Promise<void> {}

	async searchById(): Promise<null> {
		return null;
	}

	async listByTenant(): Promise<never[]> {
		return [];
	}

	async listActiveByTenantAt(): Promise<never[]> {
		return [];
	}
}

class StubCustomerPromotionUsageRepository extends CustomerPromotionUsageRepository {
	async saveUsage(): Promise<void> {}

	async searchUsage(): Promise<null> {
		return null;
	}
}

function findStampAdded(
	outcomes: StaffScanOutcome[],
	campaignId: string,
): StaffScanOutcome | undefined {
	return outcomes.find(
		(outcome) => outcome.kind === "stamp_added" && outcome.campaignId === campaignId,
	);
}

async function main(): Promise<void> {
	process.env.DISABLE_TENANT_PLAN_GATES = "1";

	const cafeTypeId = "00000000-0000-4000-8000-0000000000t1";
	const menuTypeId = "00000000-0000-4000-8000-0000000000t2";

	const coffeeCampaign = StampCampaign.fromPrimitives({
		id: "00000000-0000-4000-8000-0000000000c1",
		tenantId,
		name: "10 cafés gratis",
		requiredStamps: 10,
		rewardId: null,
		stampTypeId: cafeTypeId,
		visualTemplate: "coffee",
		cardBackgroundVariant: "coffee-photo",
		conditions: "",
		isActive: true,
	});
	const menuCampaign = StampCampaign.fromPrimitives({
		id: "00000000-0000-4000-8000-0000000000c2",
		tenantId,
		name: "5 menús gratis",
		requiredStamps: 5,
		rewardId: null,
		stampTypeId: menuTypeId,
		visualTemplate: "generic",
		cardBackgroundVariant: "coffee-photo",
		conditions: "",
		isActive: true,
	});
	const generalCampaign = StampCampaign.fromPrimitives({
		id: "00000000-0000-4000-8000-0000000000c3",
		tenantId,
		name: "8 visitas fiel",
		requiredStamps: 8,
		rewardId: null,
		stampTypeId: null,
		visualTemplate: "generic",
		cardBackgroundVariant: "coffee-photo",
		conditions: "",
		isActive: true,
	});

	const customer = Customer.register({
		tenantId,
		name: "Targeted Scan Customer",
	});

	const tenantRepository = new StubTenantRepository(baseTenant);
	const stampRepository = new InMemoryStampCampaignRepository([
		coffeeCampaign,
		menuCampaign,
		generalCampaign,
	]);
	const customerRepository = new InMemoryCustomerRepository([customer]);
	const loyaltyRepository = new InMemoryLoyaltyTransactionRepository();
	const resolvePlan = new ResolveTenantSubscriptionPlan(
		tenantRepository,
		new StubTenantBillingRepository(),
	);
	const assertFeature = new AssertTenantPlanFeature(resolvePlan);
	const resolveCustomer = new ResolveCustomerByQrForStaffScan(
		customerRepository,
		new StubUserRepository(),
	);

	const useCase = new RecordStaffScanByTarget(
		tenantRepository,
		customerRepository,
		resolveCustomer,
		loyaltyRepository,
		stampRepository,
		new StubPromotionRepository(),
		new StubCustomerPromotionUsageRepository(),
		assertFeature,
	);

	const baseParams = {
		tenantId,
		qrValue: customer.qrValue,
		createdByUserId: staffUserId,
		staffRole: TenantRole.Owner,
	};

	try {
		await useCase.execute({
			...baseParams,
			targetType: undefined,
			targetId: coffeeCampaign.id,
		});
		console.error("❌ expected InvalidStampScan when targetType omitted");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof InvalidStampScan)) {
			console.error("❌ wrong error when targetType omitted", error);
			process.exit(1);
		}
	}

	console.log("✅ missing targetType → InvalidStampScan");

	for (let i = 1; i <= 3; i += 1) {
		const result = await useCase.execute({
			...baseParams,
			targetType: "stamp_campaign",
			targetId: coffeeCampaign.id,
		});
		const stamp = findStampAdded(result.outcomes, coffeeCampaign.id);

		if (!stamp || stamp.kind !== "stamp_added" || stamp.current !== i) {
			console.error(`❌ café scan ${i}`, result.outcomes);
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
			...baseParams,
			targetType: "stamp_campaign",
			targetId: menuCampaign.id,
		});
		const stamp = findStampAdded(result.outcomes, menuCampaign.id);

		if (!stamp || stamp.kind !== "stamp_added" || stamp.current !== i) {
			console.error(`❌ menú scan ${i}`, result.outcomes);
			process.exit(1);
		}
	}

	console.log("✅ menú scans only advance menu campaign");

	const general = await useCase.execute({
		...baseParams,
		targetType: "stamp_campaign",
		targetId: generalCampaign.id,
	});
	const generalStamp = findStampAdded(general.outcomes, generalCampaign.id);

	if (!generalStamp || generalStamp.kind !== "stamp_added" || generalStamp.current !== 1) {
		console.error("❌ general scan", general.outcomes);
		process.exit(1);
	}

	console.log("✅ generic campaign scan advances only selected target");
	console.log("✅ verify:customer-stamp-scan-targeted-use-case passed");
}

void main();
