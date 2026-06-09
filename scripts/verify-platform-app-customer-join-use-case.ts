/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { UserFinder } from "../src/contexts/identity/users/application/find/UserFinder";
import { User } from "../src/contexts/identity/users/domain/User";
import { UserId } from "../src/contexts/identity/users/domain/UserId";
import { UserRepository, UserWithPasswordHash } from "../src/contexts/identity/users/domain/UserRepository";
import { JoinTenantAsCustomer } from "../src/contexts/loyalty/customers/application/join/JoinTenantAsCustomer";
import { Customer } from "../src/contexts/loyalty/customers/domain/Customer";
import { CustomerRepository } from "../src/contexts/loyalty/customers/domain/CustomerRepository";
import { ListUserRelationships } from "../src/contexts/tenants/memberships/application/list/ListUserRelationships";
import { TenantMembershipRepository } from "../src/contexts/tenants/memberships/domain/TenantMembershipRepository";
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
	private readonly customers = new Map<string, Customer>();

	private key(userId: string, tenantId: string): string {
		return `${userId}:${tenantId}`;
	}

	async save(customer: Customer): Promise<void> {
		const p = customer.toPrimitives();
		if (p.userId) {
			this.customers.set(this.key(p.userId, p.tenantId), customer);
		}
	}

	async searchById(): Promise<Customer | null> {
		return null;
	}

	async searchByQrValue(): Promise<Customer | null> {
		return null;
	}

	async searchByUserIdAndTenantId(userId: string, tenantId: string): Promise<Customer | null> {
		return this.customers.get(this.key(userId, tenantId)) ?? null;
	}

	async listWithInteractionByUserId(userId: string) {
		return Array.from(this.customers.values())
			.filter((customer) => customer.userId === userId)
			.map((customer) => ({
				customerId: customer.id,
				tenantId: customer.tenantId,
				name: "Stub Tenant",
				slug: "stub",
				logoUrl: null,
				pointsBalance: customer.pointsBalance,
				visitsCount: customer.visitsCount,
			}));
	}
}

class EmptyMembershipRepository extends TenantMembershipRepository {
	async findStaffMembership(): Promise<null> {
		return null;
	}

	async findFirstStaffMembershipByUserId(): Promise<null> {
		return null;
	}

	async findOwnerMembershipByUserId(): Promise<null> {
		return null;
	}

	async listOwnerMembershipsByUserId(): Promise<never[]> {
		return [];
	}

	async findById(): Promise<null> {
		return null;
	}

	async createStaffMembership(): Promise<{ membershipId: string }> {
		return { membershipId: "stub" };
	}

	async listEmployeesByTenant(): Promise<never[]> {
		return [];
	}
}

const activeTenant = Tenant.fromPrimitives({
	id: "tenant-join",
	name: "Join Cafe",
	slug: "join-cafe",
	logoUrl: "",
	primaryColor: "#000",
	secondaryColor: "#fff",
	subscriptionPlan: "basic",
	subscriptionPlanId: null,
	status: TenantStatus.Active,
	createdAt: new Date().toISOString(),
});

const suspendedTenant = Tenant.fromPrimitives({
	...activeTenant.toPrimitives(),
	id: "tenant-suspended",
	slug: "suspended-cafe",
	status: TenantStatus.Suspended,
});

const userId = "user-join-1";
const user = User.create(userId, "Join User", "join@example.local");
const users = new Map<string, UserWithPasswordHash>([
	[user.email.value, { user, passwordHash: "hash" }],
]);

const tenantRepo = new InMemoryTenantRepository(
	new Map([
		["join-cafe", activeTenant],
		["suspended-cafe", suspendedTenant],
	]),
);
const customerRepo = new InMemoryCustomerRepository();
const join = new JoinTenantAsCustomer(tenantRepo, customerRepo, new UserFinder(new InMemoryUserRepository(users)));
const relationships = new ListUserRelationships(new EmptyMembershipRepository(), customerRepo);

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
	const first = await join.execute({ userId, slug: "join-cafe" });
	if (!first.created || first.customer.userId !== userId || first.customer.tenantId !== activeTenant.id) {
		console.error("❌ first join should create linked customer");
		process.exit(1);
	}

	console.log("✅ first join creates customers row with user_id");

	const second = await join.execute({ userId, slug: "join-cafe" });
	if (second.created || second.customer.id !== first.customer.id) {
		console.error("❌ second join must be idempotent");
		process.exit(1);
	}

	console.log("✅ idempotent join returns same customer");

	const rel = await relationships.list(userId);
	if (rel.establishments.length !== 1 || rel.establishments[0]?.pointsBalance !== 0) {
		console.error("❌ joined local should appear in relationships at 0 pts");
		process.exit(1);
	}

	console.log("✅ explicit join counts as interaction in ListUserRelationships");

	await expectError("unknown slug", () => join.execute({ userId, slug: "missing" }), TenantNotFound);

	console.log("✅ unknown slug → TenantNotFound");

	await expectError(
		"suspended tenant",
		() => join.execute({ userId, slug: "suspended-cafe" }),
		TenantAccessSuspended,
	);

	console.log("✅ suspended tenant → TenantAccessSuspended");

	console.log("✅ verify:platform-app-customer-join-use-case passed");
}

void main();
