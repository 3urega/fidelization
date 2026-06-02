import { Tenant } from "../src/contexts/tenants/tenants/domain/Tenant";
import { TenantStaffLogin } from "../src/contexts/tenants/memberships/application/authenticate/TenantStaffLogin";
import { TenantSessionVerifier } from "../src/contexts/tenants/memberships/application/verify/TenantSessionVerifier";
import { CrossTenantAccessDenied } from "../src/contexts/tenants/memberships/domain/CrossTenantAccessDenied";
import { InvalidTenantSession } from "../src/contexts/tenants/memberships/domain/InvalidTenantSession";
import {
	StaffMembership,
	TenantMembershipRepository,
} from "../src/contexts/tenants/memberships/domain/TenantMembershipRepository";
import { STAFF_TENANT_ROLES, TenantRole, isStaffRole } from "../src/contexts/tenants/memberships/domain/TenantRole";
import { DEMO_TENANT_ID } from "../src/lib/tenant/mockTenantBySlug";

const demoTenant = Tenant.fromPrimitives({
	id: DEMO_TENANT_ID,
	name: "Café Demo",
	slug: "cafe-demo",
	logoUrl: "",
	primaryColor: "#7C3AED",
	secondaryColor: "#4F46E5",
	subscriptionPlan: "FREE",
});

const otherTenantId = "00000000-0000-4000-8000-000000000099";

const demoMembership: StaffMembership = { tenant: demoTenant, role: TenantRole.Owner };

class StubMembershipRepository extends TenantMembershipRepository {
	constructor(private readonly byKey: Map<string, StaffMembership | null>) {
		super();
	}

	async findStaffMembership(userId: string, tenantId: string): Promise<StaffMembership | null> {
		return this.byKey.get(`${userId}:${tenantId}`) ?? null;
	}

	async findFirstStaffMembershipByUserId(userId: string): Promise<StaffMembership | null> {
		return this.byKey.get(`${userId}:apex`) ?? null;
	}

	async findOwnerMembershipByUserId(): Promise<StaffMembership | null> {
		return null;
	}

	async findById(): Promise<Tenant | null> {
		return null;
	}
}

if (!STAFF_TENANT_ROLES.includes(TenantRole.Admin)) {
	console.error("❌ STAFF_TENANT_ROLES must include admin");
	process.exit(1);
}

if (isStaffRole(TenantRole.Customer)) {
	console.error("❌ customer must not be a staff role");
	process.exit(1);
}

const userId = "user-verify-tenant-auth";
const repo = new StubMembershipRepository(
	new Map([
		[`${userId}:${DEMO_TENANT_ID}`, demoMembership],
		[`${userId}:apex`, demoMembership],
	]),
);

const verifier = new TenantSessionVerifier(repo);

async function run(): Promise<void> {
	const session = { userId, tenantId: DEMO_TENANT_ID, role: "owner" as const };

	const ok = await verifier.verify(session, DEMO_TENANT_ID);
	if (!ok || ok.tenant.id !== DEMO_TENANT_ID) {
		console.error("❌ verify with matching host tenant failed");
		process.exit(1);
	}

	try {
		await verifier.verify(session, otherTenantId);
		console.error("❌ expected CrossTenantAccessDenied");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof CrossTenantAccessDenied)) {
			console.error("❌ wrong error for cross-tenant", error);
			process.exit(1);
		}
	}

	const emptyRepo = new StubMembershipRepository(new Map());
	const emptyVerifier = new TenantSessionVerifier(emptyRepo);

	try {
		await emptyVerifier.verify(session, undefined);
		console.error("❌ expected InvalidTenantSession");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof InvalidTenantSession)) {
			console.error("❌ wrong error for missing membership", error);
			process.exit(1);
		}
	}

	const login = new TenantStaffLogin(
		{
			login: async () => ({ id: { value: userId } }),
			loginDemo: async () => ({ id: { value: userId } }),
		} as never,
		repo,
	);

	const hostLogin = await login.loginWithPassword("a@b.c", "x", DEMO_TENANT_ID);
	if (hostLogin.membership.tenant.id !== DEMO_TENANT_ID) {
		console.error("❌ TenantStaffLogin with host tenantId failed");
		process.exit(1);
	}

	const apexLogin = await login.loginWithPassword("a@b.c", "x", null);
	if (apexLogin.membership.tenant.id !== DEMO_TENANT_ID) {
		console.error("❌ TenantStaffLogin apex fallback failed");
		process.exit(1);
	}

	console.log("✅ staff roles include admin");
	console.log("✅ TenantSessionVerifier membership + cross-tenant");
	console.log("✅ TenantStaffLogin host tenant and apex fallback");
}

void run();
