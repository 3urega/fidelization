/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { GetCustomerStampProgress } from "../src/contexts/loyalty/customers/application/profile/GetCustomerStampProgress";
import type { StampAddedSummary } from "../src/contexts/loyalty/customers/domain/StampProgressSummary";
import { ListUserRelationships } from "../src/contexts/tenants/memberships/application/list/ListUserRelationships";
import { CustomerEstablishmentSummary } from "../src/contexts/loyalty/customers/domain/CustomerEstablishmentSummary";
import { CustomerRepository } from "../src/contexts/loyalty/customers/domain/CustomerRepository";
import { Customer } from "../src/contexts/loyalty/customers/domain/Customer";
import { TenantRole } from "../src/contexts/tenants/memberships/domain/TenantRole";
import {
	StaffMembership,
	TenantMembershipRepository,
} from "../src/contexts/tenants/memberships/domain/TenantMembershipRepository";
import { Tenant } from "../src/contexts/tenants/tenants/domain/Tenant";
import { TenantStatus } from "../src/contexts/tenants/tenants/domain/TenantStatus";

class InMemoryMembershipRepository extends TenantMembershipRepository {
	constructor(private readonly byUserId: Map<string, StaffMembership[]>) {
		super();
	}

	async findStaffMembership(): Promise<StaffMembership | null> {
		return null;
	}

	async findFirstStaffMembershipByUserId(userId: string): Promise<StaffMembership | null> {
		return this.byUserId.get(userId)?.[0] ?? null;
	}

	async findOwnerMembershipByUserId(userId: string): Promise<StaffMembership | null> {
		return this.byUserId.get(userId)?.[0] ?? null;
	}

	async listOwnerMembershipsByUserId(userId: string): Promise<StaffMembership[]> {
		return this.byUserId.get(userId) ?? [];
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

class InMemoryCustomerRepository extends CustomerRepository {
	constructor(private readonly byUserId: Map<string, CustomerEstablishmentSummary[]>) {
		super();
	}

	async save(): Promise<void> {}

	async searchById(): Promise<Customer | null> {
		return null;
	}

	async searchByQrValue(): Promise<Customer | null> {
		return null;
	}

	async searchByUserIdAndTenantId(): Promise<Customer | null> {
		return null;
	}

	async listWithInteractionByUserId(userId: string): Promise<CustomerEstablishmentSummary[]> {
		return this.byUserId.get(userId) ?? [];
	}
}

class StubGetCustomerStampProgress extends GetCustomerStampProgress {
	constructor(private readonly byCustomerId: Map<string, StampAddedSummary[]>) {
		super({ findById: async () => null } as never, { listActiveByTenant: async () => [] } as never);
	}

	async execute(params: { tenantId: string; customerId: string }): Promise<StampAddedSummary[]> {
		return this.byCustomerId.get(params.customerId) ?? [];
	}
}

const tenantA = Tenant.fromPrimitives({
	id: "tenant-a",
	name: "Cafe Sol",
	slug: "cafe-sol",
	logoUrl: "https://example.com/logo.png",
	primaryColor: "#000",
	secondaryColor: "#fff",
	subscriptionPlan: "pro",
	subscriptionPlanId: "plan-pro",
	status: TenantStatus.Active,
	createdAt: new Date().toISOString(),
});

const tenantB = Tenant.fromPrimitives({
	id: "tenant-b",
	name: "Pan Luna",
	slug: "pan-luna",
	logoUrl: "",
	primaryColor: "#000",
	secondaryColor: "#fff",
	subscriptionPlan: "basic",
	subscriptionPlanId: null,
	status: TenantStatus.Active,
	createdAt: new Date().toISOString(),
});

async function main(): Promise<void> {
	const stampProgressByCustomer = new Map<string, StampAddedSummary[]>([
		[
			"cust-1",
			[
				{
					campaignId: "camp-1",
					campaignName: "Tarjeta verano",
					current: 5,
					required: 10,
					completed: false,
				},
			],
		],
	]);

	const memberships = new Map<string, StaffMembership[]>([
		["user-a", [{ tenant: tenantA, role: TenantRole.Owner }]],
		["user-b", [{ tenant: tenantB, role: TenantRole.Owner }]],
	]);
	const customers = new Map<string, CustomerEstablishmentSummary[]>([
		[
			"user-a",
			[
				{
					customerId: "cust-1",
					tenantId: "tenant-c",
					name: "Bar Norte",
					slug: "bar-norte",
					logoUrl: null,
					pointsBalance: 12,
					visitsCount: 3,
				},
				{
					customerId: "cust-owned",
					tenantId: "tenant-a",
					name: "Cafe Sol",
					slug: "cafe-sol",
					logoUrl: null,
					pointsBalance: 1,
					visitsCount: 1,
				},
			],
		],
	]);

	const list = new ListUserRelationships(
		new InMemoryMembershipRepository(memberships),
		new InMemoryCustomerRepository(customers),
		new StubGetCustomerStampProgress(stampProgressByCustomer),
	);

	const userA = await list.list("user-a");

	if (userA.businesses.length !== 1 || userA.businesses[0]?.slug !== "cafe-sol") {
		console.error("❌ expected one owner business for user-a");
		process.exit(1);
	}

	if (userA.businesses[0]?.subscriptionPlan !== "pro" || userA.businesses[0]?.logoUrl === null) {
		console.error("❌ expected plan + logo on business summary");
		process.exit(1);
	}

	if (userA.establishments.length !== 1 || userA.establishments[0]?.slug !== "bar-norte") {
		console.error("❌ expected one establishment for user-a (owned cafe-sol deduped)");
		process.exit(1);
	}

	const establishment = userA.establishments[0];
	if (
		establishment?.stampProgress.length !== 1 ||
		establishment.stampProgress[0]?.current !== 5 ||
		establishment.stampProgress[0]?.required !== 10
	) {
		console.error("❌ expected stampProgress on establishment summary", establishment);
		process.exit(1);
	}

	console.log("✅ ListUserRelationships returns businesses + establishments + stampProgress");

	const userB = await list.list("user-b");

	if (userB.businesses[0]?.slug !== "pan-luna" || userB.establishments.length !== 0) {
		console.error("❌ user-b isolation failed");
		process.exit(1);
	}

	if (userA.businesses.some((business) => business.slug === "pan-luna")) {
		console.error("❌ cross-user business leak");
		process.exit(1);
	}

	console.log("✅ relationships isolated per userId");

	const found = await list.findOwnerBusiness("user-a", "cafe-sol");
	if (!found || found.name !== "Cafe Sol") {
		console.error("❌ findOwnerBusiness failed");
		process.exit(1);
	}

	console.log("✅ findOwnerBusiness OK");

	const empty = await list.list("user-empty");
	if (empty.businesses.length !== 0 || empty.establishments.length !== 0) {
		console.error("❌ expected empty relationships");
		process.exit(1);
	}

	console.log("✅ empty relationships OK");
	console.log("✅ verify:platform-app-dashboard-use-case passed");
}

void main();
