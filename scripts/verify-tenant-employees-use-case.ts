/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { EmailAlreadyRegistered } from "../src/contexts/identity/users/domain/EmailAlreadyRegistered";
import { UserRegistrar } from "../src/contexts/identity/users/application/register/UserRegistrar";
import { User } from "../src/contexts/identity/users/domain/User";
import { UserPlan } from "../src/contexts/identity/users/domain/UserPlan";
import { CreateStampCampaign } from "../src/contexts/loyalty/stamp_campaigns/application/create/CreateStampCampaign";
import { StampCampaignForbidden } from "../src/contexts/loyalty/stamp_campaigns/domain/StampCampaignForbidden";
import { StampCampaignRepository } from "../src/contexts/loyalty/stamp_campaigns/domain/StampCampaignRepository";
import { StampTypeRepository } from "../src/contexts/loyalty/stamp_types/domain/StampTypeRepository";
import { StampType } from "../src/contexts/loyalty/stamp_types/domain/StampType";
import { AssertTenantEmployeeLimit } from "../src/contexts/billing/subscriptions/application/guard/AssertTenantEmployeeLimit";
import { SubscriptionPlan } from "../src/contexts/billing/subscriptions/domain/SubscriptionPlan";
import { PRO_PLAN_FEATURES } from "../src/contexts/billing/subscriptions/domain/SubscriptionPlanFeatures";
import { InviteTenantEmployee } from "../src/contexts/tenants/memberships/application/invite/InviteTenantEmployee";
import { ListTenantEmployees } from "../src/contexts/tenants/memberships/application/invite/ListTenantEmployees";
import {
	CreateStaffMembershipParams,
	TenantEmployee,
} from "../src/contexts/tenants/memberships/domain/TenantEmployee";
import { TenantEmployeesForbidden } from "../src/contexts/tenants/memberships/domain/TenantEmployeesForbidden";
import { TenantMembershipRepository } from "../src/contexts/tenants/memberships/domain/TenantMembershipRepository";
import { TenantRole } from "../src/contexts/tenants/memberships/domain/TenantRole";
import { UpdateTenantBranding } from "../src/contexts/tenants/tenants/application/update/UpdateTenantBranding";
import { Tenant } from "../src/contexts/tenants/tenants/domain/Tenant";
import { TenantBrandingForbidden } from "../src/contexts/tenants/tenants/domain/TenantBrandingForbidden";
import { TenantBrandingUpdate } from "../src/contexts/tenants/tenants/domain/TenantBrandingUpdate";
import { TenantRepository } from "../src/contexts/tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../src/contexts/tenants/tenants/domain/TenantStatus";

const tenantId = "00000000-0000-4000-8000-0000000000e1";

const baseTenant = Tenant.fromPrimitives({
	id: tenantId,
	name: "Employees Verify Cafe",
	slug: "employees-verify-cafe",
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

	async updateBranding(id: string, branding: TenantBrandingUpdate): Promise<Tenant | null> {
		if (!this.tenant || id !== this.tenant.id) {
			return null;
		}

		const primitives = this.tenant.toPrimitives();

		return Tenant.fromPrimitives({
			...primitives,
			logoUrl: branding.logoUrl ?? primitives.logoUrl,
			primaryColor: branding.primaryColor ?? primitives.primaryColor,
			secondaryColor: branding.secondaryColor ?? primitives.secondaryColor,
		});
	}
}

class InMemoryMembershipRepository extends TenantMembershipRepository {
	private employees: TenantEmployee[] = [];
	private users = new Map<string, User>();
	private nextMembershipId = 1;

	constructor(initialUsers: User[] = []) {
		super();
		for (const user of initialUsers) {
			this.users.set(user.email.value, user);
		}
	}

	async findStaffMembership(): Promise<null> {
		return null;
	}

	async findFirstStaffMembershipByUserId(): Promise<null> {
		return null;
	}

	async findOwnerMembershipByUserId(): Promise<null> {
		return null;
	}

	async findById(id: string): Promise<Tenant | null> {
		return id === tenantId ? baseTenant : null;
	}

	async createStaffMembership(
		params: CreateStaffMembershipParams,
	): Promise<{ membershipId: string }> {
		const user = Array.from(this.users.values()).find((row) => row.id.value === params.userId);
		if (!user) {
			throw new Error("user not found for membership");
		}

		const membershipId = `membership-${this.nextMembershipId}`;
		this.nextMembershipId += 1;

		this.employees.push({
			membershipId,
			userId: user.id.value,
			name: user.name.value,
			email: user.email.value,
			role: TenantRole.Employee,
		});

		return { membershipId };
	}

	async listEmployeesByTenant(_tenantId: string): Promise<TenantEmployee[]> {
		return [...this.employees];
	}

	registerUser(params: { name: string; email: string }): User {
		const normalizedEmail = params.email.toLowerCase().trim();
		if (this.users.has(normalizedEmail)) {
			throw new EmailAlreadyRegistered(params.email);
		}

		const user = User.fromPrimitives({
			id: `user-${this.users.size + 1}`,
			name: params.name.trim(),
			email: normalizedEmail,
			profilePicture: "",
			plan: UserPlan.Free,
			qrValue: null,
			oauthProvider: null,
			oauthSubject: null,
			searchZone: null,
		});
		this.users.set(normalizedEmail, user);

		return user;
	}
}

class StubUserRegistrar {
	constructor(private readonly membershipRepository: InMemoryMembershipRepository) {}

	async register(params: {
		name: string;
		email: string;
		password: string;
	}): Promise<User> {
		return this.membershipRepository.registerUser(params);
	}
}

class EmptyStampCampaignRepository extends StampCampaignRepository {
	async saveCampaign(): Promise<void> {}

	async deleteCampaign(): Promise<void> {}

	async searchCampaignById(): Promise<null> {
		return null;
	}

	async listByTenant(): Promise<never[]> {
		return [];
	}

	async listActiveByTenant(): Promise<never[]> {
		return [];
	}

	async saveProgress(): Promise<void> {}

	async searchProgress(): Promise<null> {
		return null;
	}

	async hasActiveGenericCampaigns(): Promise<boolean> {
		return false;
	}
}

class EmptyStampTypeRepository extends StampTypeRepository {
	async save(_stampType: StampType): Promise<void> {}

	async searchById(): Promise<null> {
		return null;
	}

	async searchBySlug(): Promise<null> {
		return null;
	}

	async listByTenant(): Promise<StampType[]> {
		return [];
	}

	async listActiveByTenant(): Promise<StampType[]> {
		return [];
	}

	async countActiveByTenant(): Promise<number> {
		return 0;
	}

	async maxSortOrder(): Promise<number> {
		return 0;
	}
}

async function main(): Promise<void> {
	const tenantRepository = new StubTenantRepository(baseTenant);
	const membershipRepository = new InMemoryMembershipRepository();
	const userRegistrar = new StubUserRegistrar(membershipRepository);
	const assertEmployeeLimit = {
		execute: async () =>
			SubscriptionPlan.fromPrimitives({
				id: "00000000-0000-4000-8000-000000000006",
				name: "pro",
				priceMonthly: 2900,
				priceYearly: 29000,
				features: PRO_PLAN_FEATURES,
				limits: { employees: 10 },
				isActive: true,
			}),
	} as unknown as AssertTenantEmployeeLimit;
	const invite = new InviteTenantEmployee(
		tenantRepository,
		membershipRepository,
		userRegistrar as unknown as UserRegistrar,
		assertEmployeeLimit,
	);
	const list = new ListTenantEmployees(tenantRepository, membershipRepository);

	const employee = await invite.execute({
		tenantId,
		role: TenantRole.Owner,
		input: {
			name: "Barista Verify",
			email: "barista.verify@example.com",
			password: "temp-pass-123",
		},
	});

	if (
		employee.role !== TenantRole.Employee ||
		employee.email !== "barista.verify@example.com" ||
		!employee.membershipId
	) {
		console.error("❌ InviteTenantEmployee success", employee);
		process.exit(1);
	}

	console.log("✅ InviteTenantEmployee creates employee membership");

	const employees = await list.execute({ tenantId, role: TenantRole.Owner });

	if (employees.length !== 1 || employees[0]?.email !== employee.email) {
		console.error("❌ ListTenantEmployees", employees);
		process.exit(1);
	}

	if ("password" in employees[0] || "passwordHash" in employees[0]) {
		console.error("❌ list must not expose passwords", employees[0]);
		process.exit(1);
	}

	console.log("✅ ListTenantEmployees returns employees without passwords");

	try {
		await invite.execute({
			tenantId,
			role: TenantRole.Owner,
			input: {
				name: "Duplicate",
				email: "barista.verify@example.com",
				password: "temp-pass-123",
			},
		});
		console.error("❌ expected EmailAlreadyRegistered");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof EmailAlreadyRegistered)) {
			console.error("❌ wrong error for duplicate email", error);
			process.exit(1);
		}
	}

	console.log("✅ duplicate email → EmailAlreadyRegistered");

	try {
		await invite.execute({
			tenantId,
			role: TenantRole.Employee,
			input: {
				name: "Blocked",
				email: "blocked@example.com",
				password: "temp-pass-123",
			},
		});
		console.error("❌ expected TenantEmployeesForbidden on invite");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof TenantEmployeesForbidden)) {
			console.error("❌ wrong error for employee invite", error);
			process.exit(1);
		}
	}

	try {
		await list.execute({ tenantId, role: TenantRole.Employee });
		console.error("❌ expected TenantEmployeesForbidden on list");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof TenantEmployeesForbidden)) {
			console.error("❌ wrong error for employee list", error);
			process.exit(1);
		}
	}

	console.log("✅ non-owner invite/list → TenantEmployeesForbidden");

	const branding = new UpdateTenantBranding(tenantRepository);

	try {
		await branding.execute({
			tenantId,
			role: TenantRole.Employee,
			branding: { primaryColor: "#111111" },
		});
		console.error("❌ expected TenantBrandingForbidden");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof TenantBrandingForbidden)) {
			console.error("❌ wrong error for employee branding", error);
			process.exit(1);
		}
	}

	console.log("✅ employee role → TenantBrandingForbidden");

	const createStamp = new CreateStampCampaign(
		tenantRepository,
		new EmptyStampCampaignRepository(),
		new EmptyStampTypeRepository(),
	);

	try {
		await createStamp.execute({
			tenantId,
			role: TenantRole.Employee,
			input: { name: "Blocked campaign", requiredStamps: 3 },
		});
		console.error("❌ expected StampCampaignForbidden");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof StampCampaignForbidden)) {
			console.error("❌ wrong error for employee stamp campaign", error);
			process.exit(1);
		}
	}

	console.log("✅ employee role → StampCampaignForbidden");
	console.log("✅ verify:tenant-employees-use-case passed");
}

void main();
