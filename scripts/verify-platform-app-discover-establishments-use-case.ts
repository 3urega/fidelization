/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { ListDiscoverableEstablishments } from "../src/contexts/tenants/tenants/application/list/ListDiscoverableEstablishments";
import { Tenant } from "../src/contexts/tenants/tenants/domain/Tenant";
import { TenantRepository } from "../src/contexts/tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../src/contexts/tenants/tenants/domain/TenantStatus";

const tenantA = Tenant.fromPrimitives({
	id: "00000000-0000-4000-8000-0000000000a1",
	name: "Alpha Cafe",
	slug: "alpha-cafe",
	logoUrl: "https://example.com/alpha.png",
	primaryColor: "#7C3AED",
	secondaryColor: "#4F46E5",
	subscriptionPlan: "FREE",
	subscriptionPlanId: null,
	status: TenantStatus.Active,
	createdAt: new Date().toISOString(),
});

const tenantB = Tenant.fromPrimitives({
	id: "00000000-0000-4000-8000-0000000000b2",
	name: "Beta Bar",
	slug: "beta-bar",
	logoUrl: "",
	primaryColor: "#7C3AED",
	secondaryColor: "#4F46E5",
	subscriptionPlan: "FREE",
	subscriptionPlanId: null,
	status: TenantStatus.Active,
	createdAt: new Date().toISOString(),
});

const tenantSuspended = Tenant.fromPrimitives({
	id: "00000000-0000-4000-8000-0000000000c3",
	name: "Closed Shop",
	slug: "closed-shop",
	logoUrl: "",
	primaryColor: "#7C3AED",
	secondaryColor: "#4F46E5",
	subscriptionPlan: "FREE",
	subscriptionPlanId: null,
	status: TenantStatus.Suspended,
	createdAt: new Date().toISOString(),
});

class StubTenantRepository extends TenantRepository {
	constructor(private readonly activeTenants: Tenant[]) {
		super();
	}

	async findAll(): Promise<Tenant[]> {
		return this.activeTenants;
	}

	async findById(id: string): Promise<Tenant | null> {
		return this.activeTenants.find((tenant) => tenant.id === id) ?? null;
	}

	async listDiscoverableActive(params: { page: number; limit: number }) {
		const active = this.activeTenants
			.filter((tenant) => tenant.status === TenantStatus.Active)
			.sort((left, right) => left.name.localeCompare(right.name));
		const skip = params.page * params.limit;
		const slice = active.slice(skip, skip + params.limit + 1);
		const hasMore = slice.length > params.limit;
		const pageRows = hasMore ? slice.slice(0, params.limit) : slice;

		return {
			establishments: pageRows.map((tenant) => ({
				id: tenant.id,
				name: tenant.name,
				slug: tenant.slug,
				logoUrl: tenant.logoUrl.trim() ? tenant.logoUrl.trim() : null,
			})),
			hasMore,
		};
	}
}

async function main(): Promise<void> {
	const repository = new StubTenantRepository([tenantSuspended, tenantB, tenantA]);
	const list = new ListDiscoverableEstablishments(repository);

	const firstPage = await list.execute({ page: 0, limit: 1 });

	if (
		firstPage.establishments.length !== 1 ||
		firstPage.establishments[0]?.slug !== "alpha-cafe" ||
		!firstPage.hasMore
	) {
		console.error("❌ first page", firstPage);
		process.exit(1);
	}

	console.log("✅ first page ordered by name with hasMore");

	const secondPage = await list.execute({ page: 1, limit: 1 });

	if (
		secondPage.establishments.length !== 1 ||
		secondPage.establishments[0]?.slug !== "beta-bar" ||
		secondPage.establishments[0]?.logoUrl !== null ||
		secondPage.hasMore
	) {
		console.error("❌ second page", secondPage);
		process.exit(1);
	}

	console.log("✅ second page + empty logoUrl → null");

	const all = await list.execute({ page: 0, limit: 10 });

	if (all.establishments.length !== 2 || all.hasMore) {
		console.error("❌ full page excludes suspended", all);
		process.exit(1);
	}

	console.log("✅ suspended tenants excluded");
	console.log("✅ verify:platform-app-discover-establishments-use-case passed");
}

void main();
