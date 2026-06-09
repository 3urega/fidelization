/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { randomUUID } from "crypto";

import { EnterTenantStaffFromUserSession } from "../src/contexts/tenants/memberships/application/authenticate/EnterTenantStaffFromUserSession";
import { StaffMembershipNotFound } from "../src/contexts/tenants/memberships/domain/StaffMembershipNotFound";
import { TenantMembershipRepository } from "../src/contexts/tenants/memberships/domain/TenantMembershipRepository";
import { TenantRole } from "../src/contexts/tenants/memberships/domain/TenantRole";
import { UserFinder } from "../src/contexts/identity/users/application/find/UserFinder";
import { User } from "../src/contexts/identity/users/domain/User";
import { UserId } from "../src/contexts/identity/users/domain/UserId";
import { UserRepository } from "../src/contexts/identity/users/domain/UserRepository";
import { Tenant } from "../src/contexts/tenants/tenants/domain/Tenant";
import { TenantNotFound } from "../src/contexts/tenants/tenants/domain/TenantNotFound";
import { TenantRepository } from "../src/contexts/tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../src/contexts/tenants/tenants/domain/TenantStatus";

class StubUserRepository extends UserRepository {
	async isPlatformSuperadmin(): Promise<boolean> {
		return false;
	}

	async save(): Promise<void> {
		return;
	}

	async search(): Promise<User | null> {
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

	async updatePasswordHash(): Promise<void> {
		return;
	}
}

class StubUserFinder extends UserFinder {
	constructor(private readonly user: User) {
		super(new StubUserRepository());
	}

	async find(): Promise<User> {
		return this.user;
	}
}

class StubTenantRepository extends TenantRepository {
	constructor(private readonly tenant: Tenant | null) {
		super();
	}

	async findAll(): Promise<Tenant[]> {
		return this.tenant ? [this.tenant] : [];
	}

	async findById(): Promise<Tenant | null> {
		return this.tenant;
	}

	async findBySlug(slug: string): Promise<Tenant | null> {
		return this.tenant?.slug === slug ? this.tenant : null;
	}

	async updateStatus(): Promise<Tenant | null> {
		return this.tenant;
	}

	async updateBranding(): Promise<Tenant | null> {
		return this.tenant;
	}
}

class StubMembershipRepository extends TenantMembershipRepository {
	constructor(
		private readonly membership: {
			tenant: Tenant;
			role: TenantRole;
		} | null,
	) {
		super();
	}

	async findStaffMembership(): Promise<{ tenant: Tenant; role: TenantRole } | null> {
		return this.membership;
	}

	async findFirstStaffMembershipByUserId(): Promise<null> {
		return null;
	}

	async findOwnerMembershipByUserId(): Promise<null> {
		return null;
	}

	async listOwnerMembershipsByUserId(): Promise<[]> {
		return [];
	}

	async findById(): Promise<Tenant | null> {
		return this.membership?.tenant ?? null;
	}

	async createStaffMembership(): Promise<{ membershipId: string }> {
		return { membershipId: "stub" };
	}

	async listEmployeesByTenant(): Promise<[]> {
		return [];
	}
}

function buildUser(): User {
	return User.fromPrimitives({
		id: randomUUID(),
		name: "Verify Enter User",
		email: "verify-enter@example.local",
		profilePicture: "",
		plan: "FREE",
		qrValue: `qr-${randomUUID()}`,
		oauthProvider: null,
		oauthSubject: null,
	});
}

function buildTenant(slug: string): Tenant {
	return Tenant.fromPrimitives({
		id: randomUUID(),
		name: "Verify Cafe",
		slug,
		logoUrl: "",
		primaryColor: "",
		secondaryColor: "",
		subscriptionPlan: "basic",
		subscriptionPlanId: null,
		status: TenantStatus.Active,
		createdAt: new Date().toISOString(),
	});
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
			console.error(`❌ wrong error for ${label}:`, error);
			process.exit(1);
		}
	}
}

async function main(): Promise<void> {
	const user = buildUser();
	const tenant = buildTenant("verify-enter-cafe");
	const useCase = new EnterTenantStaffFromUserSession(
		new StubUserFinder(user),
		new StubUserRepository(),
		new StubTenantRepository(tenant),
		new StubMembershipRepository({ tenant, role: TenantRole.Owner }),
	);

	const result = await useCase.enter({ userId: user.id.value, tenantSlug: tenant.slug });

	if (result.user.id.value !== user.id.value || result.membership.role !== TenantRole.Owner) {
		console.error("❌ enter should resolve owner membership", result);
		process.exit(1);
	}

	console.log("✅ EnterTenantStaffFromUserSession resolves owner membership");

	const missingTenant = new EnterTenantStaffFromUserSession(
		new StubUserFinder(user),
		new StubUserRepository(),
		new StubTenantRepository(null),
		new StubMembershipRepository({ tenant, role: TenantRole.Owner }),
	);
	await expectError("missing tenant", () => missingTenant.enter({ userId: user.id.value, tenantSlug: "missing" }), TenantNotFound);

	console.log("✅ EnterTenantStaffFromUserSession rejects unknown slug");

	const missingMembership = new EnterTenantStaffFromUserSession(
		new StubUserFinder(user),
		new StubUserRepository(),
		new StubTenantRepository(tenant),
		new StubMembershipRepository(null),
	);
	await expectError(
		"missing membership",
		() => missingMembership.enter({ userId: user.id.value, tenantSlug: tenant.slug }),
		StaffMembershipNotFound,
	);

	console.log("✅ EnterTenantStaffFromUserSession rejects missing staff membership");
	console.log("✅ verify:platform-app-enter-tenant-use-case passed");
}

void main();
