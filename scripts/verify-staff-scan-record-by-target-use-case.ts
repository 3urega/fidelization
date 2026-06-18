/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { AssertTenantPlanFeature } from "../src/contexts/billing/subscriptions/application/guard/AssertTenantPlanFeature";
import { ResolveTenantEffectivePlanFeatures } from "../src/contexts/billing/subscriptions/application/resolve/ResolveTenantEffectivePlanFeatures";
import { ResolveTenantSubscriptionPlan } from "../src/contexts/billing/subscriptions/application/resolve/ResolveTenantSubscriptionPlan";
import { PRO_PLAN_FEATURES } from "../src/contexts/billing/subscriptions/domain/SubscriptionPlanFeatures";
import { SubscriptionPlan } from "../src/contexts/billing/subscriptions/domain/SubscriptionPlan";
import { TenantBillingRepository } from "../src/contexts/billing/subscriptions/domain/TenantBillingRepository";
import { User } from "../src/contexts/identity/users/domain/User";
import { UserId } from "../src/contexts/identity/users/domain/UserId";
import { UserRepository } from "../src/contexts/identity/users/domain/UserRepository";
import type { UserSearchZone } from "../src/contexts/identity/users/domain/UserSearchZone";
import { RecordStaffScanByTarget } from "../src/contexts/loyalty/customers/application/scan/RecordStaffScanByTarget";
import { ResolveCustomerByQrForStaffScan } from "../src/contexts/loyalty/customers/application/scan/ResolveCustomerByQrForStaffScan";
import { Customer } from "../src/contexts/loyalty/customers/domain/Customer";
import { CustomerRepository } from "../src/contexts/loyalty/customers/domain/CustomerRepository";
import { InvalidStampScan } from "../src/contexts/loyalty/customers/domain/InvalidStampScan";
import { StaffScanForbidden } from "../src/contexts/loyalty/customers/domain/StaffScanForbidden";
import type { StaffScanOutcome } from "../src/contexts/loyalty/customers/domain/StaffScanOutcome";
import { LoyaltyTransaction } from "../src/contexts/loyalty/loyalty_transactions/domain/LoyaltyTransaction";
import { LoyaltyTransactionRepository } from "../src/contexts/loyalty/loyalty_transactions/domain/LoyaltyTransactionRepository";
import { CustomerPromotionUsage } from "../src/contexts/loyalty/promotions/domain/CustomerPromotionUsage";
import { CustomerPromotionUsageRepository } from "../src/contexts/loyalty/promotions/domain/CustomerPromotionUsageRepository";
import { Promotion } from "../src/contexts/loyalty/promotions/domain/Promotion";
import { PromotionRepository } from "../src/contexts/loyalty/promotions/domain/PromotionRepository";
import { CustomerStampProgress } from "../src/contexts/loyalty/stamp_campaigns/domain/CustomerStampProgress";
import { StampCampaign } from "../src/contexts/loyalty/stamp_campaigns/domain/StampCampaign";
import { StampCampaignRepository } from "../src/contexts/loyalty/stamp_campaigns/domain/StampCampaignRepository";
import { TenantRole } from "../src/contexts/tenants/memberships/domain/TenantRole";
import { Tenant } from "../src/contexts/tenants/tenants/domain/Tenant";
import { TenantRepository } from "../src/contexts/tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../src/contexts/tenants/tenants/domain/TenantStatus";

const tenantId = "00000000-0000-4000-8000-0000000000r1";
const staffUserId = "00000000-0000-4000-8000-0000000000r2";
const planProId = "00000000-0000-4000-8000-000000000006";
const cafeTypeId = "00000000-0000-4000-8000-0000000000t1";
const campaignAId = "00000000-0000-4000-8000-0000000000c1";
const campaignBId = "00000000-0000-4000-8000-0000000000c2";
const campaignCompleteId = "00000000-0000-4000-8000-0000000000c3";
const promoId = "00000000-0000-4000-8000-0000000000p1";
const platformUserId = "00000000-0000-4000-8000-0000000000u1";
const platformUserQr = "platform-user-qr-record-target";
const customerQr = "legacy-customer-qr-record-target";

const planPro = SubscriptionPlan.fromPrimitives({
	id: planProId,
	name: "pro",
	priceMonthly: 2900,
	priceYearly: 29000,
	features: PRO_PLAN_FEATURES,
	limits: { employees: 10 },
	isActive: true,
});

const baseTenant = Tenant.fromPrimitives({
	id: tenantId,
	name: "Record Staff Scan Target Cafe",
	slug: "record-staff-scan-target",
	logoUrl: "",
	primaryColor: "#7C3AED",
	secondaryColor: "#4F46E5",
	subscriptionPlan: "pro",
	subscriptionPlanId: planProId,
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

class InMemoryTenantBillingRepository extends TenantBillingRepository {
	constructor(private readonly plans: SubscriptionPlan[]) {
		super();
	}

	async savePlan(): Promise<void> {}

	async searchPlanByName(name: string): Promise<SubscriptionPlan | null> {
		return this.plans.find((plan) => plan.name === name) ?? null;
	}

	async searchPlanById(planId: string): Promise<SubscriptionPlan | null> {
		return this.plans.find((plan) => plan.id === planId) ?? null;
	}

	async listActivePlans(): Promise<SubscriptionPlan[]> {
		return this.plans.filter((plan) => plan.isActive);
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

	constructor(initial: Customer[] = []) {
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

	async searchByUserIdAndTenantId(userIdValue: string, tenantIdValue: string): Promise<Customer | null> {
		return (
			Array.from(this.customers.values()).find(
				(row) => row.tenantId === tenantIdValue && row.userId === userIdValue,
			) ?? null
		);
	}

	async listWithInteractionByUserId(): Promise<never[]> {
		return [];
	}

	findById(id: string): Customer | undefined {
		return this.customers.get(id);
	}

	all(): Customer[] {
		return Array.from(this.customers.values());
	}
}

class InMemoryUserRepository extends UserRepository {
	constructor(private readonly usersByQr: Map<string, User>) {
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
		return this.usersByQr.get(qrValue) ?? null;
	}

	async searchByOAuthSubject(): Promise<null> {
		return null;
	}

	async updatePasswordHash(): Promise<void> {}

	async assignQrValueIfAbsent(_userId: UserId, _qrValue: string): Promise<void> {}

	async updateSearchZone(_userId: UserId, _zone: UserSearchZone | null): Promise<User> {
		throw new Error("updateSearchZone not implemented");
	}

	async isPlatformSuperadmin(): Promise<boolean> {
		return false;
	}
}

class InMemoryLoyaltyTransactionRepository extends LoyaltyTransactionRepository {
	saved: LoyaltyTransaction[] = [];

	async save(transaction: LoyaltyTransaction): Promise<void> {
		this.saved.push(transaction);
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

	async hasActiveGenericCampaigns(): Promise<boolean> {
		return false;
	}

	getProgress(customerId: string, campaignId: string): CustomerStampProgress | undefined {
		return this.progress.get(`${customerId}:${campaignId}`);
	}
}

class InMemoryPromotionRepository extends PromotionRepository {
	constructor(private readonly promotions: Promotion[]) {
		super();
	}

	async save(): Promise<void> {}

	async searchById(tenantIdValue: string, id: string): Promise<Promotion | null> {
		const promotion = this.promotions.find((row) => row.id === id);

		return promotion && promotion.tenantId === tenantIdValue ? promotion : null;
	}

	async listByTenant(): Promise<Promotion[]> {
		return this.promotions;
	}

	async listActiveByTenantAt(tenantIdValue: string, at: Date): Promise<Promotion[]> {
		return this.promotions.filter((promotion) => {
			if (promotion.tenantId !== tenantIdValue || !promotion.isActive) {
				return false;
			}

			if (promotion.startDate && promotion.startDate > at) {
				return false;
			}

			if (promotion.endDate && promotion.endDate < at) {
				return false;
			}

			return true;
		});
	}
}

class InMemoryCustomerPromotionUsageRepository extends CustomerPromotionUsageRepository {
	private usages = new Map<string, CustomerPromotionUsage>();

	async saveUsage(usage: CustomerPromotionUsage): Promise<void> {
		this.usages.set(`${usage.customerId}:${usage.promotionId}`, usage);
	}

	async searchUsage(
		tenantIdValue: string,
		customerId: string,
		promotionId: string,
	): Promise<CustomerPromotionUsage | null> {
		const row = this.usages.get(`${customerId}:${promotionId}`);

		return row && row.tenantId === tenantIdValue ? row : null;
	}
}

function outcomeKinds(outcomes: StaffScanOutcome[]): string[] {
	return outcomes.map((outcome) => outcome.kind);
}

function hasKind(outcomes: StaffScanOutcome[], kind: StaffScanOutcome["kind"]): boolean {
	return outcomes.some((outcome) => outcome.kind === kind);
}

function buildUseCase(
	customerRepository: InMemoryCustomerRepository,
	userRepository: InMemoryUserRepository,
	stampRepository: InMemoryStampCampaignRepository,
	promotionRepository: InMemoryPromotionRepository,
	usageRepository: InMemoryCustomerPromotionUsageRepository,
	loyaltyRepository: InMemoryLoyaltyTransactionRepository,
): RecordStaffScanByTarget {
	const tenantRepository = new StubTenantRepository(baseTenant);
	const billingRepository = new InMemoryTenantBillingRepository([planPro]);
	const resolvePlan = new ResolveTenantSubscriptionPlan(tenantRepository, billingRepository);
	const resolveEffective = new ResolveTenantEffectivePlanFeatures(resolvePlan, tenantRepository);
	const assertFeature = new AssertTenantPlanFeature(resolveEffective);
	const resolveCustomer = new ResolveCustomerByQrForStaffScan(customerRepository, userRepository);

	return new RecordStaffScanByTarget(
		tenantRepository,
		customerRepository,
		resolveCustomer,
		loyaltyRepository,
		stampRepository,
		promotionRepository,
		usageRepository,
		assertFeature,
	);
}

const campaignA = StampCampaign.fromPrimitives({
	id: campaignAId,
	tenantId,
	name: "10 cafés A",
	requiredStamps: 10,
	rewardId: null,
	stampTypeId: cafeTypeId,
	visualTemplate: "coffee",
	cardBackgroundVariant: "coffee-photo",
	conditions: "",
	isActive: true,
});

const campaignB = StampCampaign.fromPrimitives({
	id: campaignBId,
	tenantId,
	name: "5 cafés B",
	requiredStamps: 5,
	rewardId: null,
	stampTypeId: cafeTypeId,
	visualTemplate: "coffee",
	cardBackgroundVariant: "coffee-photo",
	conditions: "",
	isActive: true,
});

const campaignComplete = StampCampaign.fromPrimitives({
	id: campaignCompleteId,
	tenantId,
	name: "2 sellos completar",
	requiredStamps: 2,
	rewardId: null,
	stampTypeId: cafeTypeId,
	visualTemplate: "generic",
	cardBackgroundVariant: "coffee-photo",
	conditions: "",
	isActive: true,
});

const promo = Promotion.fromPrimitives({
	id: promoId,
	tenantId,
	title: "2x1 pasteles",
	description: "Válido hoy",
	type: "discount",
	startDate: "2026-01-01T00:00:00.000Z",
	endDate: "2026-12-31T23:59:59.000Z",
	isActive: true,
	maxUsesPerUser: 2,
});

const legacyCustomer = Customer.fromPrimitives({
	id: "00000000-0000-4000-8000-0000000000cu1",
	tenantId,
	userId: null,
	name: "Legacy Customer",
	email: null,
	phone: null,
	qrValue: customerQr,
	pointsBalance: 0,
	visitsCount: 0,
});

const platformUser = User.create(
	platformUserId,
	"Platform User",
	"platform@example.local",
	"",
	platformUserQr,
);

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
	process.env.DISABLE_TENANT_PLAN_GATES = "0";

	const customerRepository = new InMemoryCustomerRepository([legacyCustomer]);
	const userRepository = new InMemoryUserRepository(new Map([[platformUserQr, platformUser]]));
	const stampRepository = new InMemoryStampCampaignRepository([
		campaignA,
		campaignB,
		campaignComplete,
	]);
	const promotionRepository = new InMemoryPromotionRepository([promo]);
	const usageRepository = new InMemoryCustomerPromotionUsageRepository();
	const loyaltyRepository = new InMemoryLoyaltyTransactionRepository();

	const useCase = buildUseCase(
		customerRepository,
		userRepository,
		stampRepository,
		promotionRepository,
		usageRepository,
		loyaltyRepository,
	);

	const scanA = await useCase.execute({
		tenantId,
		qrValue: customerQr,
		targetType: "stamp_campaign",
		targetId: campaignAId,
		createdByUserId: staffUserId,
		staffRole: TenantRole.Owner,
	});

	if (
		!hasKind(scanA.outcomes, "point_recorded") ||
		!hasKind(scanA.outcomes, "stamp_added") ||
		scanA.outcomes.find((o) => o.kind === "stamp_added")?.current !== 1
	) {
		console.error("❌ scan campaign A outcomes", scanA.outcomes);
		process.exit(1);
	}

	const progressB = stampRepository.getProgress(legacyCustomer.id, campaignBId);
	const progressA = stampRepository.getProgress(legacyCustomer.id, campaignAId);

	if (!progressA || progressA.currentStamps !== 1 || progressB) {
		console.error("❌ scan A should only mutate campaign A", { progressA, progressB });
		process.exit(1);
	}

	console.log("✅ two campaigns same stampTypeId → scan A only mutates A");

	const scanB = await useCase.execute({
		tenantId,
		qrValue: customerQr,
		targetType: "stamp_campaign",
		targetId: campaignBId,
		createdByUserId: staffUserId,
		staffRole: TenantRole.Owner,
	});

	const progressBAfter = stampRepository.getProgress(legacyCustomer.id, campaignBId);
	if (!progressBAfter || progressBAfter.currentStamps !== 1) {
		console.error("❌ scan B progress", progressBAfter);
		process.exit(1);
	}

	const progressAAfter = stampRepository.getProgress(legacyCustomer.id, campaignAId);
	if (!progressAAfter || progressAAfter.currentStamps !== 1) {
		console.error("❌ scan B should not change campaign A", progressAAfter);
		process.exit(1);
	}

	console.log("✅ scan B only mutates B");

	const completeFirst = await useCase.execute({
		tenantId,
		qrValue: customerQr,
		targetType: "stamp_campaign",
		targetId: campaignCompleteId,
		createdByUserId: staffUserId,
		staffRole: TenantRole.Owner,
	});

	if (!hasKind(completeFirst.outcomes, "stamp_added") || hasKind(completeFirst.outcomes, "card_completed")) {
		console.error("❌ first complete campaign scan", completeFirst.outcomes);
		process.exit(1);
	}

	const completeSecond = await useCase.execute({
		tenantId,
		qrValue: customerQr,
		targetType: "stamp_campaign",
		targetId: campaignCompleteId,
		createdByUserId: staffUserId,
		staffRole: TenantRole.Owner,
	});

	const kinds = outcomeKinds(completeSecond.outcomes);
	if (
		!kinds.includes("point_recorded") ||
		!kinds.includes("stamp_added") ||
		!kinds.includes("card_completed")
	) {
		console.error("❌ complete card outcomes", completeSecond.outcomes);
		process.exit(1);
	}

	const stampOutcome = completeSecond.outcomes.find((o) => o.kind === "stamp_added");
	if (stampOutcome?.kind !== "stamp_added" || stampOutcome.current !== 2 || stampOutcome.required !== 2) {
		console.error("❌ stamp_added fields", stampOutcome);
		process.exit(1);
	}

	console.log("✅ complete card → stamp_added + card_completed + point_recorded");

	const rescanCompleted = await useCase.execute({
		tenantId,
		qrValue: customerQr,
		targetType: "stamp_campaign",
		targetId: campaignCompleteId,
		createdByUserId: staffUserId,
		staffRole: TenantRole.Owner,
	});

	if (
		!hasKind(rescanCompleted.outcomes, "point_recorded") ||
		!hasKind(rescanCompleted.outcomes, "card_already_completed") ||
		hasKind(rescanCompleted.outcomes, "stamp_added")
	) {
		console.error("❌ rescan completed card", rescanCompleted.outcomes);
		process.exit(1);
	}

	console.log("✅ rescan completed card → card_already_completed + point_recorded");

	const promoApplied = await useCase.execute({
		tenantId,
		qrValue: customerQr,
		targetType: "promotion",
		targetId: promoId,
		createdByUserId: staffUserId,
		staffRole: TenantRole.Owner,
	});

	if (
		!hasKind(promoApplied.outcomes, "point_recorded") ||
		!hasKind(promoApplied.outcomes, "promotion_applied")
	) {
		console.error("❌ promo applied outcomes", promoApplied.outcomes);
		process.exit(1);
	}

	const promoApplied2 = await useCase.execute({
		tenantId,
		qrValue: customerQr,
		targetType: "promotion",
		targetId: promoId,
		createdByUserId: staffUserId,
		staffRole: TenantRole.Owner,
	});

	if (!hasKind(promoApplied2.outcomes, "promotion_applied")) {
		console.error("❌ second promo use", promoApplied2.outcomes);
		process.exit(1);
	}

	const promoExhausted = await useCase.execute({
		tenantId,
		qrValue: customerQr,
		targetType: "promotion",
		targetId: promoId,
		createdByUserId: staffUserId,
		staffRole: TenantRole.Owner,
	});

	if (
		!hasKind(promoExhausted.outcomes, "point_recorded") ||
		!hasKind(promoExhausted.outcomes, "promotion_exhausted") ||
		hasKind(promoExhausted.outcomes, "promotion_applied")
	) {
		console.error("❌ promo exhausted outcomes", promoExhausted.outcomes);
		process.exit(1);
	}

	console.log("✅ promotion applied then exhausted with point_recorded");

	const autoJoinCampaign = await useCase.execute({
		tenantId,
		qrValue: platformUserQr,
		targetType: "stamp_campaign",
		targetId: campaignAId,
		createdByUserId: staffUserId,
		staffRole: TenantRole.Employee,
	});

	const joinedCustomers = customerRepository.all().filter((row) => row.userId === platformUserId);
	if (joinedCustomers.length !== 1 || !hasKind(autoJoinCampaign.outcomes, "stamp_added")) {
		console.error("❌ auto-join stamp campaign", joinedCustomers, autoJoinCampaign.outcomes);
		process.exit(1);
	}

	console.log("✅ auto-join platform user on stamp_campaign scan");

	const freshCustomerRepo = new InMemoryCustomerRepository();
	const freshUsageRepo = new InMemoryCustomerPromotionUsageRepository();
	const freshLoyaltyRepo = new InMemoryLoyaltyTransactionRepository();
	const autoJoinPromoUseCase = buildUseCase(
		freshCustomerRepo,
		userRepository,
		stampRepository,
		promotionRepository,
		freshUsageRepo,
		freshLoyaltyRepo,
	);

	const autoJoinPromo = await autoJoinPromoUseCase.execute({
		tenantId,
		qrValue: platformUserQr,
		targetType: "promotion",
		targetId: promoId,
		createdByUserId: staffUserId,
		staffRole: TenantRole.Employee,
	});

	const joinedForPromo = freshCustomerRepo.all().filter((row) => row.userId === platformUserId);
	if (joinedForPromo.length !== 1 || !hasKind(autoJoinPromo.outcomes, "promotion_applied")) {
		console.error("❌ auto-join promotion", joinedForPromo, autoJoinPromo.outcomes);
		process.exit(1);
	}

	console.log("✅ auto-join platform user on promotion scan");

	await expectError(
		"missing targetType",
		() =>
			useCase.execute({
				tenantId,
				qrValue: customerQr,
				targetType: undefined,
				targetId: campaignAId,
				createdByUserId: staffUserId,
				staffRole: TenantRole.Owner,
			}),
		InvalidStampScan,
	);

	await expectError(
		"customer role forbidden",
		() =>
			useCase.execute({
				tenantId,
				qrValue: customerQr,
				targetType: "stamp_campaign",
				targetId: campaignAId,
				createdByUserId: staffUserId,
				staffRole: TenantRole.Customer,
			}),
		StaffScanForbidden,
	);

	console.log("✅ verify:staff-scan-record-by-target-use-case passed");
}

void main();
