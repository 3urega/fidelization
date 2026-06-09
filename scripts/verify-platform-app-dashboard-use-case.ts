/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { randomUUID } from "crypto";

import { ListUserRelationships } from "../src/contexts/tenants/memberships/application/list/ListUserRelationships";
import { TenantRole } from "../src/contexts/tenants/memberships/domain/TenantRole";
import {
	StaffMembership,
	TenantMembershipRepository,
} from "../src/contexts/tenants/memberships/domain/TenantMembershipRepository";
import { Tenant } from "../src/contexts/tenants/tenants/domain/Tenant";
import { TenantStatus } from "../src/contexts/tenants/tenants/domain/TenantStatus";
import { slugifyBusinessName } from "../src/lib/tenant/slugifyBusinessName";

class InMemoryMembershipRepository extends TenantMembershipRepository {
	constructor(private readonly ownerMemberships: StaffMembership[]) {
		super();
	}

	async findStaffMembership(): Promise<StaffMembership | null> {
		return null;
	}

	async findFirstStaffMembershipByUserId(): Promise<StaffMembership | null> {
		return this.ownerMemberships[0] ?? null;
	}

	async findOwnerMembershipByUserId(): Promise<StaffMembership | null> {
		return this.ownerMemberships[0] ?? null;
	}

	async listOwnerMembershipsByUserId(): Promise<StaffMembership[]> {
		return this.ownerMemberships;
	}

	async findById(): Promise<Tenant | null> {
		return null;
	}

	async createStaffMembership(): Promise<{ membershipId: string }> {
		return { membershipId: "stub" };
	}

	async listEmployeesByTenant(): Promise<never[]> {
		return [];
	}
}

const tenant = Tenant.fromPrimitives({
	id: "tenant-1",
	name: "Cafe Sol",
	slug: "cafe-sol",
	logoUrl: "",
	primaryColor: "#000",
	secondaryColor: "#fff",
	subscriptionPlan: "basic",
	subscriptionPlanId: null,
	status: TenantStatus.Active,
	createdAt: new Date().toISOString(),
});

async function main(): Promise<void> {
	const list = new ListUserRelationships(
		new InMemoryMembershipRepository([{ tenant, role: TenantRole.Owner }]),
	);

	const result = await list.list("user-1");

	if (result.businesses.length !== 1 || result.businesses[0]?.slug !== "cafe-sol") {
		console.error("❌ expected one owner business");
		process.exit(1);
	}

	if (result.establishments.length !== 0) {
		console.error("❌ establishments should be empty in MVP");
		process.exit(1);
	}

	console.log("✅ ListUserRelationships returns owner businesses");

	const empty = new ListUserRelationships(new InMemoryMembershipRepository([]));
	const emptyResult = await empty.list("user-2");

	if (emptyResult.businesses.length !== 0) {
		console.error("❌ expected empty businesses");
		process.exit(1);
	}

	console.log("✅ ListUserRelationships empty state OK");
	console.log("✅ verify:platform-app-dashboard-use-case passed");
}

void main();
