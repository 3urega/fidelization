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

	async searchById(): Promise<null> {
		return null;
	}

	async searchByQrValue(tenantIdValue: string, qrValue: string): Promise<Customer | null> {
		return (
			Array.from(this.customers.values()).find(
				(customer) => customer.tenantId === tenantIdValue && customer.qrValue === qrValue,
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

class InMemoryLoyaltyTransactionRepository extends LoyaltyTransactionRepository {
	readonly saved: LoyaltyTransaction[] = [];

	async save(transaction: LoyaltyTransaction): Promise<void> {
		this.saved.push(transaction);
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

	async deleteCampaign(): Promise<void> {}

	async searchCampaignById(tenantIdValue: string, id: string): Promise<StampCampaign | null> {
		const campaign = this.campaigns.get(id);

		return campaign && campaign.tenantId === tenantIdValue ? campaign : null;
	}

	async listByTenant(tenantIdValue: string): Promise<StampCampaign[]> {
		return Array.from(this.campaigns.values()).filter((campaign) => campaign.tenantId === tenantIdValue);
	}

	async listActiveByTenant(tenantIdValue: string): Promise<StampCampaign[]> {
		return Array.from(this.campaigns.values()).filter(
			(campaign) => campaign.tenantId === tenantIdValue && campaign.isActive,
		);
	}

	async hasActiveGenericCampaigns(): Promise<boolean> {
		return false;
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

	async searchByOAuthSubject(): Promise<null> {
		return null;
	}

	async updatePasswordHash(): Promise<void> {}

	async isPlatformSuperadmin(): Promise<boolean> {
		return false;
	}
}

function hasKind(outcomes: StaffScanOutcome[], kind: StaffScanOutcome["kind"]): boolean {
	return outcomes.some((outcome) => outcome.kind === kind);
}

function findStampAdded(
	outcomes: StaffScanOutcome[],
	campaignId: string,
): StaffScanOutcome | undefined {
	return outcomes.find(
		(outcome) => outcome.kind === "stamp_added" && outcome.campaignId === campaignId,
	);
}

async function expectError<T extends Error>(
	label: string,
	action: () => Promise<unknown>,
	Expected: new (...args: never[]) => T,
): Promise<void> {
	try {
		await action();
		console.error(`❌ expected ${Expected.name} for ${label}`);
		process.exit(1);
	} catch (error) {
		if (!(error instanceof Expected)) {
			console.error(`❌ wrong error for ${label}`, error);
			process.exit(1);
		}
	}

	console.log(`✅ ${label} → ${Expected.name}`);
}

async function main(): Promise<void> {
	process.env.DISABLE_TENANT_PLAN_GATES = "1";

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

	const scanParams = {
		tenantId,
		qrValue: customer.qrValue,
		targetType: "stamp_campaign" as const,
		targetId: activeCampaign.id,
		createdByUserId: staffUserId,
		staffRole: TenantRole.Owner,
	};

	const first = await useCase.execute(scanParams);
	const firstStamp = findStampAdded(first.outcomes, activeCampaign.id);

	if (!firstStamp || firstStamp.kind !== "stamp_added" || firstStamp.current !== 1) {
		console.error("❌ first scan outcomes", first.outcomes);
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

	await useCase.execute(scanParams);
	await useCase.execute(scanParams);

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

	const afterCompleted = await useCase.execute(scanParams);

	if (
		!hasKind(afterCompleted.outcomes, "card_already_completed") ||
		hasKind(afterCompleted.outcomes, "stamp_added")
	) {
		console.error("❌ completed campaign should not add stamps", afterCompleted.outcomes);
		process.exit(1);
	}

	const stampTxAfterCompleted = loyaltyRepository.saved.filter((tx) => tx.type === "stamp_added").length;
	if (stampTxAfterCompleted !== 3) {
		console.error("❌ expected 3 stamp_added rows total, got", stampTxAfterCompleted);
		process.exit(1);
	}

	console.log("✅ completed campaign does not add more stamps");

	await expectError(
		"inactive campaign target",
		() =>
			useCase.execute({
				...scanParams,
				targetId: deactivated.id,
			}),
		InvalidStampScan,
	);

	const inactiveProgress = stampRepository.getProgress(customer.id, deactivated.id);
	if (inactiveProgress) {
		console.error("❌ inactive campaign should not have progress", inactiveProgress.toPrimitives());
		process.exit(1);
	}

	console.log("✅ inactive campaign target rejected");
	console.log("✅ verify:customer-stamp-scan-use-case passed");
}

void main();
