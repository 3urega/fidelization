/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { GetEstablishmentDetailForUser } from "../src/contexts/loyalty/customers/application/profile/GetEstablishmentDetailForUser";
import { ListCustomerPromotionSummaries } from "../src/contexts/loyalty/promotions/application/list/ListCustomerPromotionSummaries";
import { customerPromotionSummaryFromPromotion } from "../src/contexts/loyalty/promotions/domain/CustomerPromotionSummary";
import { ListUserCrossTenantPromotions } from "../src/contexts/loyalty/promotions/application/list/ListUserCrossTenantPromotions";
import { CustomerStampProgress } from "../src/contexts/loyalty/stamp_campaigns/domain/CustomerStampProgress";
import { StampCampaign } from "../src/contexts/loyalty/stamp_campaigns/domain/StampCampaign";
import { StampCampaignRepository } from "../src/contexts/loyalty/stamp_campaigns/domain/StampCampaignRepository";
import { StampTypeRepository } from "../src/contexts/loyalty/stamp_types/domain/StampTypeRepository";
import { Customer } from "../src/contexts/loyalty/customers/domain/Customer";
import { CustomerRepository } from "../src/contexts/loyalty/customers/domain/CustomerRepository";
import { UserFinder } from "../src/contexts/identity/users/application/find/UserFinder";
import { User } from "../src/contexts/identity/users/domain/User";
import { UserId } from "../src/contexts/identity/users/domain/UserId";
import { UserRepository, UserWithPasswordHash } from "../src/contexts/identity/users/domain/UserRepository";
import { TenantAccessSuspended } from "../src/contexts/tenants/tenants/domain/TenantAccessSuspended";
import { TenantNotFound } from "../src/contexts/tenants/tenants/domain/TenantNotFound";
import { Tenant } from "../src/contexts/tenants/tenants/domain/Tenant";
import { TenantRepository } from "../src/contexts/tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../src/contexts/tenants/tenants/domain/TenantStatus";

class InMemoryUserRepository extends UserRepository {
	constructor(private readonly users: Map<string, UserWithPasswordHash>) {
		super();
	}

	async save(): Promise<void> {}

	async search(id: UserId): Promise<User | null> {
		for (const row of this.users.values()) {
			if (row.user.id.value === id.value) {
				return row.user;
			}
		}

		return null;
	}

	async searchByEmail(): Promise<UserWithPasswordHash | null> {
		return null;
	}

	async searchByQrValue(): Promise<User | null> {
		return null;
	}

	async searchByOAuthSubject(): Promise<User | null> {
		return null;
	}

	async updatePasswordHash(): Promise<void> {}

	async isPlatformSuperadmin(): Promise<boolean> {
		return false;
	}
}

class InMemoryTenantRepository extends TenantRepository {
	constructor(private readonly bySlug: Map<string, Tenant>) {
		super();
	}

	async findAll(): Promise<Tenant[]> {
		return Array.from(this.bySlug.values());
	}

	async findById(tenantId: string): Promise<Tenant | null> {
		for (const tenant of this.bySlug.values()) {
			if (tenant.id === tenantId) {
				return tenant;
			}
		}

		return null;
	}

	async findBySlug(slug: string): Promise<Tenant | null> {
		return this.bySlug.get(slug.trim().toLowerCase()) ?? null;
	}

	async updateStatus(): Promise<Tenant | null> {
		return null;
	}

	async updateBranding(): Promise<Tenant | null> {
		return null;
	}
}

class InMemoryCustomerRepository extends CustomerRepository {
	constructor(private readonly byKey: Map<string, Customer>) {
		super();
	}

	private key(userId: string, tenantId: string): string {
		return `${userId}:${tenantId}`;
	}

	async save(customer: Customer): Promise<void> {
		const p = customer.toPrimitives();
		if (p.userId) {
			this.byKey.set(this.key(p.userId, p.tenantId), customer);
		}
	}

	async searchById(): Promise<Customer | null> {
		return null;
	}

	async searchByQrValue(): Promise<Customer | null> {
		return null;
	}

	async searchByUserIdAndTenantId(userId: string, tenantId: string): Promise<Customer | null> {
		return this.byKey.get(this.key(userId, tenantId)) ?? null;
	}

	async listWithInteractionByUserId(userId: string) {
		return Array.from(this.byKey.values())
			.filter((customer) => customer.userId === userId)
			.map((customer) => ({
				customerId: customer.id,
				tenantId: customer.tenantId,
				name: "Other Cafe",
				slug: "other-cafe",
				logoUrl: null,
				pointsBalance: customer.pointsBalance,
				visitsCount: customer.visitsCount,
			}));
	}
}

class StubListCustomerPromotionSummaries {
	async execute(params: { customerId?: string | null }) {
		const usedCount = params.customerId ? 1 : 0;

		return [
			customerPromotionSummaryFromPromotion(
				{
					toPrimitives: () => ({
						id: "promo-detail",
						tenantId: "tenant-detail",
						title: "Detail Promo",
						description: "Verify",
						type: "discount" as const,
						startDate: null,
						endDate: null,
						isActive: true,
						maxUsesPerUser: 2,
					}),
				} as never,
				usedCount,
			),
		];
	}
}

class StubGetCustomerStampProgress {
	async execute() {
		return [];
	}
}

class StubGetCustomerActiveRewards {
	async execute() {
		return [];
	}
}

class StubListUserCrossTenantPromotions {
	async execute() {
		return [];
	}
}

class InMemoryStampCampaignRepository extends StampCampaignRepository {
	private campaigns = new Map<string, StampCampaign>();

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

	async saveProgress(): Promise<void> {}

	async searchProgress(): Promise<CustomerStampProgress | null> {
		return null;
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
	async save(): Promise<void> {}

	async searchById(): Promise<null> {
		return null;
	}

	async searchBySlug(): Promise<null> {
		return null;
	}

	async listByTenant(): Promise<[]> {
		return [];
	}
}

const activeTenant = Tenant.fromPrimitives({
	id: "tenant-detail",
	name: "Detail Cafe",
	slug: "detail-cafe",
	logoUrl: "https://example.com/logo.png",
	primaryColor: "#112233",
	secondaryColor: "#ffffff",
	subscriptionPlan: "pro",
	subscriptionPlanId: "plan-pro",
	status: TenantStatus.Active,
	createdAt: new Date().toISOString(),
	coverImageUrl: "https://example.com/cover.png",
});

const previewCampaign = StampCampaign.create({
	tenantId: "tenant-detail",
	name: "Preview loyalty card",
	requiredStamps: 5,
});

const suspendedTenant = Tenant.fromPrimitives({
	...activeTenant.toPrimitives(),
	id: "tenant-suspended",
	slug: "suspended-detail",
	status: TenantStatus.Suspended,
});

const userId = "user-detail-1";
const user = User.create(userId, "Detail User", "detail@example.local", "", "user-qr-global");
const users = new Map<string, UserWithPasswordHash>([
	[user.email.value, { user, passwordHash: "hash" }],
]);

const linkedCustomer = Customer.joinForPlatformUser({
	tenantId: activeTenant.id,
	userId,
	name: "Detail User",
	email: "detail@example.local",
});

const tenantRepo = new InMemoryTenantRepository(
	new Map([
		["detail-cafe", activeTenant],
		["suspended-detail", suspendedTenant],
	]),
);
const customerRepo = new InMemoryCustomerRepository(
	new Map([[`${userId}:${activeTenant.id}`, linkedCustomer]]),
);
const getDetail = new GetEstablishmentDetailForUser(
	tenantRepo,
	customerRepo,
	new StubListCustomerPromotionSummaries() as unknown as ListCustomerPromotionSummaries,
	new StubGetCustomerStampProgress() as never,
	new StubGetCustomerActiveRewards() as never,
	new StubListUserCrossTenantPromotions() as unknown as ListUserCrossTenantPromotions,
	new UserFinder(new InMemoryUserRepository(users)),
	new InMemoryStampCampaignRepository([previewCampaign]),
	new InMemoryStampTypeRepository(),
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
			console.error(`❌ wrong error for ${label}:`, error);
			process.exit(1);
		}
	}
}

async function main(): Promise<void> {
	const discovery = await getDetail.execute({ userId: "user-without-link", slug: "detail-cafe" });
	if (discovery.mode !== "discovery" || discovery.customer !== null) {
		console.error("❌ expected discovery mode without customer");
		process.exit(1);
	}

	if (discovery.tenant.coverImageUrl !== "https://example.com/cover.png") {
		console.error("❌ expected tenant coverImageUrl in discovery", discovery.tenant.coverImageUrl);
		process.exit(1);
	}

	if (
		discovery.stampProgress.length !== 1 ||
		discovery.stampProgress[0]?.current !== 0 ||
		discovery.stampProgress[0]?.campaignName !== "Preview loyalty card"
	) {
		console.error("❌ expected stamp campaign preview in discovery", discovery.stampProgress);
		process.exit(1);
	}

	console.log("✅ discovery mode when no customer link");

	const interaction = await getDetail.execute({ userId, slug: "detail-cafe" });
	if (
		interaction.mode !== "interaction" ||
		!interaction.customer ||
		interaction.customer.id !== linkedCustomer.id ||
		interaction.userQrValue !== "user-qr-global"
	) {
		console.error("❌ expected interaction mode with customer and user QR");
		process.exit(1);
	}

	console.log("✅ interaction mode when customer linked");

	await expectError("unknown slug", () => getDetail.execute({ userId, slug: "missing" }), TenantNotFound);

	console.log("✅ unknown slug → TenantNotFound");

	await expectError(
		"suspended tenant",
		() => getDetail.execute({ userId, slug: "suspended-detail" }),
		TenantAccessSuspended,
	);

	console.log("✅ suspended tenant → TenantAccessSuspended");

	console.log("✅ verify:platform-app-establishment-detail-use-case passed");
}

void main();
