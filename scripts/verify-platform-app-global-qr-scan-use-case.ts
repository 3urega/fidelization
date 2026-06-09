/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { User } from "../src/contexts/identity/users/domain/User";
import { UserRepository } from "../src/contexts/identity/users/domain/UserRepository";
import { RecordCustomerVisitByQr } from "../src/contexts/loyalty/customers/application/scan/RecordCustomerVisitByQr";
import { Customer } from "../src/contexts/loyalty/customers/domain/Customer";
import { CustomerRepository } from "../src/contexts/loyalty/customers/domain/CustomerRepository";
import { LoyaltyTransactionRepository } from "../src/contexts/loyalty/loyalty_transactions/domain/LoyaltyTransactionRepository";
import { StampCampaignRepository } from "../src/contexts/loyalty/stamp_campaigns/domain/StampCampaignRepository";
import { Tenant } from "../src/contexts/tenants/tenants/domain/Tenant";
import { TenantRepository } from "../src/contexts/tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../src/contexts/tenants/tenants/domain/TenantStatus";

const tenantId = "00000000-0000-4000-8000-0000000000e1";
const staffUserId = "00000000-0000-4000-8000-0000000000e2";
const platformUserId = "00000000-0000-4000-8000-0000000000e3";
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

	async isPlatformSuperadmin(): Promise<boolean> {
		return false;
	}
}

class InMemoryCustomerRepository extends CustomerRepository {
	constructor(private readonly customers: Customer[]) {
		super();
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

	async searchByQrValue(tenantId: string, qrValue: string): Promise<Customer | null> {
		return (
			this.customers.find(
				(customer) => customer.tenantId === tenantId && customer.qrValue === qrValue,
			) ?? null
		);
	}

	async searchByUserIdAndTenantId(userId: string, tenantId: string): Promise<Customer | null> {
		return (
			this.customers.find(
				(customer) => customer.userId === userId && customer.tenantId === tenantId,
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

class NoopStampCampaignRepository extends StampCampaignRepository {
	async saveCampaign(): Promise<void> {}

	async searchCampaignById(): Promise<null> {
		return null;
	}

	async listActiveByTenant(): Promise<never[]> {
		return [];
	}

	async saveProgress(): Promise<void> {}

	async searchProgress(): Promise<null> {
		return null;
	}
}

async function main(): Promise<void> {
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
	const useCase = new RecordCustomerVisitByQr(
		tenantRepository,
		customerRepository,
		userRepository,
		new NoopLoyaltyTransactionRepository(),
		new NoopStampCampaignRepository(),
	);

	const legacyResult = await useCase.execute({
		tenantId,
		qrValue: legacyCustomer.qrValue,
		createdByUserId: staffUserId,
	});

	if (legacyResult.customer.id !== legacyCustomer.id || legacyResult.customer.pointsBalance !== 1) {
		console.error("❌ legacy customer QR path failed", legacyResult.customer.toPrimitives());
		process.exit(1);
	}

	console.log("✅ legacy customers.qr_value scan still works");

	const globalResult = await useCase.execute({
		tenantId,
		qrValue: userGlobalQr,
		createdByUserId: staffUserId,
	});

	if (globalResult.customer.id !== linkedCustomer.id || globalResult.customer.pointsBalance !== 1) {
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
		tenantId,
		qrValue: orphanUserQr,
		createdByUserId: staffUserId,
	});

	if (
		orphanResult.customer.userId !== orphanUserId ||
		orphanResult.customer.pointsBalance !== 1 ||
		orphanResult.customer.visitsCount !== 1
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
