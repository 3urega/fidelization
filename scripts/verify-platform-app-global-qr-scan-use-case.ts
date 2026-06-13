/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { AssertTenantPlanFeature } from "../src/contexts/billing/subscriptions/application/guard/AssertTenantPlanFeature";
import { ResolveTenantSubscriptionPlan } from "../src/contexts/billing/subscriptions/application/resolve/ResolveTenantSubscriptionPlan";
import { TenantBillingRepository } from "../src/contexts/billing/subscriptions/domain/TenantBillingRepository";
import { User } from "../src/contexts/identity/users/domain/User";
import { UserRepository } from "../src/contexts/identity/users/domain/UserRepository";
import { RecordStaffScanByTarget } from "../src/contexts/loyalty/customers/application/scan/RecordStaffScanByTarget";
import { ResolveCustomerByQrForStaffScan } from "../src/contexts/loyalty/customers/application/scan/ResolveCustomerByQrForStaffScan";
import { Customer } from "../src/contexts/loyalty/customers/domain/Customer";
import { CustomerRepository } from "../src/contexts/loyalty/customers/domain/CustomerRepository";
import type { StaffScanOutcome } from "../src/contexts/loyalty/customers/domain/StaffScanOutcome";
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

const tenantId = "00000000-0000-4000-8000-0000000000e1";
const staffUserId = "00000000-0000-4000-8000-0000000000e2";
const platformUserId = "00000000-0000-4000-8000-0000000000e3";
const campaignId = "00000000-0000-4000-8000-0000000000c1";
const userGlobalQr = "platform-user-global-qr-verify";

const baseTenant = Tenant.fromPrimitives({
	id: tenantId,
	name: "Global QR Scan Verify Cafe",
	slug: "global-qr-scan-verify-cafe",
	logoUrl: "",
	primaryColor: "#7C3AED",
	secondaryColor: "#4F46E5",
	subscriptionPlan: "FREE",
	subscriptionPlanId: null,
	status: TenantStatus.Active,
	createdAt: new Date().toISOString(),
});

const scanCampaign = StampCampaign.fromPrimitives({
	id: campaignId,
	tenantId,
	name: "Global QR verify campaign",
	requiredStamps: 10,
	rewardId: null,
	stampTypeId: null,
	visualTemplate: "generic",
	cardBackgroundVariant: "coffee-photo",
	conditions: "",
	isActive: true,
});

class StubTenantRepository extends TenantRepository {
	constructor(private readonly tenant: Tenant) {
		super();
	}

	async findAll(): Promise<Tenant[]> {
		return [this.tenant];
	}

	async findById(id: string): Promise<Tenant | null> {
		return id === this.tenant.id ? this.tenant : null;
	}

	async findBySlug(): Promise<Tenant | null> {
		return null;
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

class InMemoryUserRepository extends UserRepository {
	constructor(private readonly byQr: Map<string, User>) {
		super();
	}

	async save(): Promise<void> {}

	async search(): Promise<null> {
		return null;
	}

	async searchByEmail(): Promise<null> {
		return null;
	}

	async searchByQrValue(qrValue: string): Promise<User | null> {
		return this.byQr.get(qrValue.trim()) ?? null;
	}

	async searchByOAuthSubject(): Promise<User | null> {
		return null;
	}

	async updatePasswordHash(): Promise<void> {}

	async assignQrValueIfAbsent(_userId: UserId, _qrValue: string): Promise<void> {}

	async isPlatformSuperadmin(): Promise<boolean> {
		return false;
	}
}

class InMemoryCustomerRepository extends CustomerRepository {
	private customers: Customer[];

	constructor(initial: Customer[]) {
		super();
		this.customers = [...initial];
	}

	async save(customer: Customer): Promise<void> {
		const index = this.customers.findIndex((row) => row.id === customer.id);
		if (index >= 0) {
			this.customers[index] = customer;
		} else {
			this.customers.push(customer);
		}
	}

	async searchById(): Promise<null> {
		return null;
	}

	async searchByQrValue(tenantIdValue: string, qrValue: string): Promise<Customer | null> {
		return (
			this.customers.find(
				(customer) => customer.tenantId === tenantIdValue && customer.qrValue === qrValue,
			) ?? null
		);
	}

	async searchByUserIdAndTenantId(userId: string, tenantIdValue: string): Promise<Customer | null> {
		return (
			this.customers.find(
				(customer) => customer.userId === userId && customer.tenantId === tenantIdValue,
			) ?? null
		);
	}

	async listWithInteractionByUserId(): Promise<never[]> {
		return [];
	}
}

class NoopLoyaltyTransactionRepository extends LoyaltyTransactionRepository {
	async save(): Promise<void> {}

	async searchById(): Promise<null> {
		return null;
	}
}

class InMemoryStampCampaignRepository extends StampCampaignRepository {
	private progress = new Map<string, CustomerStampProgress>();

	constructor(private readonly campaigns: StampCampaign[]) {
		super();
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

	async hasActiveGenericCampaigns(): Promise<boolean> {
		return this.campaigns.some(
			(campaign) =>
				campaign.tenantId === tenantId && campaign.isActive && campaign.stampTypeId === null,
		);
	}

	async saveProgress(progress: CustomerStampProgress): Promise<void> {
		this.progress.set(`${progress.customerId}:${progress.campaignId}`, progress);
	}

	async searchProgress(
		tenantIdValue: string,
		customerId: string,
		campaignIdValue: string,
	): Promise<CustomerStampProgress | null> {
		const row = this.progress.get(`${customerId}:${campaignIdValue}`);

		return row && row.tenantId === tenantIdValue ? row : null;
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

function hasKind(outcomes: StaffScanOutcome[], kind: StaffScanOutcome["kind"]): boolean {
	return outcomes.some((outcome) => outcome.kind === kind);
}

async function main(): Promise<void> {
	process.env.DISABLE_TENANT_PLAN_GATES = "1";

	const legacyCustomer = Customer.register({
		tenantId,
		name: "Legacy Web Customer",
	});
	const linkedCustomer = Customer.joinForPlatformUser({
		tenantId,
		userId: platformUserId,
		name: "Platform App User",
		email: "platform@example.local",
	});
	const platformUser = User.create(
		platformUserId,
		"Platform App User",
		"platform@example.local",
		"",
		userGlobalQr,
	);

	const usersByQr = new Map<string, User>([[userGlobalQr, platformUser]]);

	const tenantRepository = new StubTenantRepository(baseTenant);
	const customerRepository = new InMemoryCustomerRepository([legacyCustomer, linkedCustomer]);
	const userRepository = new InMemoryUserRepository(usersByQr);
	const stampRepository = new InMemoryStampCampaignRepository([scanCampaign]);
	const resolvePlan = new ResolveTenantSubscriptionPlan(
		tenantRepository,
		new StubTenantBillingRepository(),
	);
	const assertFeature = new AssertTenantPlanFeature(resolvePlan);
	const resolveCustomer = new ResolveCustomerByQrForStaffScan(customerRepository, userRepository);

	const useCase = new RecordStaffScanByTarget(
		tenantRepository,
		customerRepository,
		resolveCustomer,
		new NoopLoyaltyTransactionRepository(),
		stampRepository,
		new StubPromotionRepository(),
		new StubCustomerPromotionUsageRepository(),
		assertFeature,
	);

	const scanParams = {
		tenantId,
		targetType: "stamp_campaign" as const,
		targetId: campaignId,
		createdByUserId: staffUserId,
		staffRole: TenantRole.Owner,
	};

	const legacyResult = await useCase.execute({
		...scanParams,
		qrValue: legacyCustomer.qrValue,
	});

	if (
		legacyResult.customer.id !== legacyCustomer.id ||
		legacyResult.customer.pointsBalance !== 1 ||
		!hasKind(legacyResult.outcomes, "point_recorded")
	) {
		console.error("❌ legacy customer QR path failed", legacyResult.customer.toPrimitives());
		process.exit(1);
	}

	console.log("✅ legacy customers.qr_value scan still works");

	const globalResult = await useCase.execute({
		...scanParams,
		qrValue: userGlobalQr,
	});

	if (
		globalResult.customer.id !== linkedCustomer.id ||
		globalResult.customer.pointsBalance !== 1 ||
		!hasKind(globalResult.outcomes, "point_recorded")
	) {
		console.error("❌ users.qr_value → linked customer failed", globalResult.customer.toPrimitives());
		process.exit(1);
	}

	console.log("✅ users.qr_value resolves linked customer in tenant");

	const orphanUserQr = "orphan-user-qr-verify";
	const orphanUserId = "00000000-0000-4000-8000-0000000000e4";
	const orphanUser = User.create(
		orphanUserId,
		"Orphan User",
		"orphan@example.local",
		"",
		orphanUserQr,
	);
	usersByQr.set(orphanUserQr, orphanUser);

	const orphanResult = await useCase.execute({
		...scanParams,
		qrValue: orphanUserQr,
	});

	if (
		orphanResult.customer.userId !== orphanUserId ||
		orphanResult.customer.pointsBalance !== 1 ||
		orphanResult.customer.visitsCount !== 1 ||
		!hasKind(orphanResult.outcomes, "point_recorded")
	) {
		console.error("❌ auto-join on first scan failed", orphanResult.customer.toPrimitives());
		process.exit(1);
	}

	const persistedOrphan = await customerRepository.searchByUserIdAndTenantId(
		orphanUserId,
		tenantId,
	);
	if (!persistedOrphan || persistedOrphan.id !== orphanResult.customer.id) {
		console.error("❌ auto-join customer not persisted");
		process.exit(1);
	}

	console.log("✅ first scan auto-joins platform user as customer in tenant");

	console.log("✅ verify:platform-app-global-qr-scan-use-case passed");
}

void main();
