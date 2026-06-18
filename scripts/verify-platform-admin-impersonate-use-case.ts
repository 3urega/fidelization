/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { ImpersonateTenantOwnerFromPlatformSession } from "../src/contexts/platform/application/impersonation/ImpersonateTenantOwnerFromPlatformSession";
import {
	type PlatformImpersonationEventRecord,
	PlatformImpersonationEventRepository,
} from "../src/contexts/platform/domain/PlatformImpersonationEventRepository";
import { TenantHasNoOwner } from "../src/contexts/platform/domain/TenantHasNoOwner";
import { UserFinder } from "../src/contexts/identity/users/application/find/UserFinder";
import { User } from "../src/contexts/identity/users/domain/User";
import { UserId } from "../src/contexts/identity/users/domain/UserId";
import { UserRepository } from "../src/contexts/identity/users/domain/UserRepository";
import type { UserSearchZone } from "../src/contexts/identity/users/domain/UserSearchZone";
import {
	type OwnerStaffMembership,
	StaffMembership,
	TenantMembershipRepository,
} from "../src/contexts/tenants/memberships/domain/TenantMembershipRepository";
import { TenantRole } from "../src/contexts/tenants/memberships/domain/TenantRole";
import { Tenant } from "../src/contexts/tenants/tenants/domain/Tenant";
import { TenantNotFound } from "../src/contexts/tenants/tenants/domain/TenantNotFound";
import { TenantRepository } from "../src/contexts/tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../src/contexts/tenants/tenants/domain/TenantStatus";

const platformUserId = "00000000-0000-4000-8000-0000000000sa";
const tenantId = "00000000-0000-4000-8000-0000000000t1";
const ownerUserId = "00000000-0000-4000-8000-0000000000ow";

const tenant = Tenant.fromPrimitives({
	id: tenantId,
	name: "Cafe Demo",
	slug: "cafe-demo",
	logoUrl: "",
	primaryColor: "#7C3AED",
	secondaryColor: "#4F46E5",
	subscriptionPlan: "basic",
	subscriptionPlanId: null,
	status: TenantStatus.Suspended,
	createdAt: "2026-06-01T10:00:00.000Z",
});

const ownerUser = User.fromPrimitives({
	id: ownerUserId,
	name: "Owner Demo",
	email: "owner@example.local",
	profilePicture: "",
	plan: "FREE",
	qrValue: "qr-owner-demo",
	oauthProvider: null,
	oauthSubject: null,
	searchZone: null,
});

class StubUserRepository extends UserRepository {
	async isPlatformSuperadmin(): Promise<boolean> {
		return false;
	}

	async save(): Promise<void> {}

	async search(id: UserId): Promise<User | null> {
		return id.value === ownerUserId ? ownerUser : null;
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

	async assignQrValueIfAbsent(): Promise<void> {}

	async updateSearchZone(_userId: UserId, _zone: UserSearchZone | null): Promise<User> {
		throw new Error("updateSearchZone not implemented");
	}
}

class StubUserFinder extends UserFinder {
	constructor() {
		super(new StubUserRepository());
	}

	async find(userId: string): Promise<User> {
		if (userId !== ownerUserId) {
			throw new Error(`unexpected user ${userId}`);
		}

		return ownerUser;
	}
}

class StubTenantRepository extends TenantRepository {
	async findAll(): Promise<Tenant[]> {
		return [tenant];
	}

	async findById(id: string): Promise<Tenant | null> {
		return id === tenantId ? tenant : null;
	}

	async findBySlug(slug: string): Promise<Tenant | null> {
		return slug === tenant.slug ? tenant : null;
	}

	async updateStatus(): Promise<Tenant | null> {
		return tenant;
	}

	async updateBranding(): Promise<Tenant | null> {
		return tenant;
	}
}

class StubMembershipRepository extends TenantMembershipRepository {
	async findStaffMembership(userId: string, tid: string): Promise<StaffMembership | null> {
		if (userId === ownerUserId && tid === tenantId) {
			return { tenant, role: TenantRole.Owner };
		}

		return null;
	}

	async findFirstStaffMembershipByUserId(): Promise<StaffMembership | null> {
		return { tenant, role: TenantRole.Owner };
	}

	async findOwnerMembershipByUserId(): Promise<StaffMembership | null> {
		return { tenant, role: TenantRole.Owner };
	}

	async listOwnerMembershipsByUserId(): Promise<StaffMembership[]> {
		return [{ tenant, role: TenantRole.Owner }];
	}

	async findFirstOwnerMembershipByTenantId(tid: string): Promise<OwnerStaffMembership | null> {
		if (tid !== tenantId) {
			return null;
		}

		return { tenant, role: TenantRole.Owner, userId: ownerUserId };
	}

	async findById(): Promise<Tenant | null> {
		return tenant;
	}

	async createStaffMembership(): Promise<{ membershipId: string }> {
		return { membershipId: "m1" };
	}

	async listEmployeesByTenant(): Promise<[]> {
		return [];
	}
}

class RecordingImpersonationRepository extends PlatformImpersonationEventRepository {
	events: PlatformImpersonationEventRecord[] = [];

	async record(event: PlatformImpersonationEventRecord): Promise<void> {
		this.events.push(event);
	}
}

async function main(): Promise<void> {
	const audit = new RecordingImpersonationRepository();
	const useCase = new ImpersonateTenantOwnerFromPlatformSession(
		new StubTenantRepository(),
		new StubMembershipRepository(),
		new StubUserFinder(),
		audit,
	);

	const result = await useCase.execute({ platformUserId, tenantId });

	if (result.user.id.value !== ownerUserId || result.membership.role !== TenantRole.Owner) {
		console.error("❌ unexpected impersonation result", result);
		process.exit(1);
	}

	if (result.membership.tenant.status !== TenantStatus.Suspended) {
		console.error("❌ suspended tenant should be impersonatable");
		process.exit(1);
	}

	if (
		audit.events.length !== 1 ||
		audit.events[0]?.platformUserId !== platformUserId ||
		audit.events[0]?.impersonatedUserId !== ownerUserId
	) {
		console.error("❌ audit event not recorded", audit.events);
		process.exit(1);
	}

	console.log("✅ ImpersonateTenantOwnerFromPlatformSession resolves owner + audit");

	const noOwnerRepo = new StubMembershipRepository();
	noOwnerRepo.findFirstOwnerMembershipByTenantId = async () => null;

	const noOwnerCase = new ImpersonateTenantOwnerFromPlatformSession(
		new StubTenantRepository(),
		noOwnerRepo,
		new StubUserFinder(),
		audit,
	);

	try {
		await noOwnerCase.execute({ platformUserId, tenantId });
		console.error("❌ expected TenantHasNoOwner");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof TenantHasNoOwner)) {
			console.error("❌ unexpected no-owner error", error);
			process.exit(1);
		}
	}

	try {
		await useCase.execute({ platformUserId, tenantId: "missing" });
		console.error("❌ expected TenantNotFound");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof TenantNotFound)) {
			console.error("❌ unexpected not-found error", error);
			process.exit(1);
		}
	}

	console.log("✅ verify:platform-admin-impersonate-use-case passed");
}

void main();
