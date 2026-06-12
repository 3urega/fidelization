/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { ListDiscoverableEstablishments } from "../src/contexts/tenants/tenants/application/list/ListDiscoverableEstablishments";
import { DEFAULT_TENANT_COVER_IMAGE_URL, resolveTenantCoverImageUrl } from "../src/lib/platform/tenantDiscoveryAssets";
import {
	parseDiscoverFilterTags,
	tenantMatchesDiscoverFilterTags,
} from "../src/contexts/tenants/tenants/domain/TenantDiscoveryTag";
import { InvalidDiscoverFilter } from "../src/contexts/tenants/tenants/domain/InvalidDiscoverFilter";
import { Tenant } from "../src/contexts/tenants/tenants/domain/Tenant";
import type { ListDiscoverableEstablishmentsParams } from "../src/contexts/tenants/tenants/domain/TenantRepository";
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
	coverImageUrl: "/uploads/tenants/alpha/cover.jpg",
	discoveryTags: ["desayunos", "cafe-autor"],
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

const tenantBrunch = Tenant.fromPrimitives({
	id: "00000000-0000-4000-8000-0000000000d4",
	name: "Brunch House",
	slug: "brunch-house",
	logoUrl: "",
	primaryColor: "#7C3AED",
	secondaryColor: "#4F46E5",
	subscriptionPlan: "FREE",
	subscriptionPlanId: null,
	status: TenantStatus.Active,
	discoveryTags: ["brunch"],
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

function makeShopTenant(index: number): Tenant {
	const label = String(index).padStart(2, "0");

	return Tenant.fromPrimitives({
		id: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
		name: `Shop ${label}`,
		slug: `shop-${label}`,
		logoUrl: "",
		primaryColor: "#7C3AED",
		secondaryColor: "#4F46E5",
		subscriptionPlan: "FREE",
		subscriptionPlanId: null,
		status: TenantStatus.Active,
		createdAt: new Date().toISOString(),
	});
}

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

	async listDiscoverableActive(params: ListDiscoverableEstablishmentsParams) {
		const filterTags = params.tags ?? [];
		const active = this.activeTenants
			.filter((tenant) => tenant.status === TenantStatus.Active)
			.filter((tenant) =>
				tenantMatchesDiscoverFilterTags(tenant.discoveryTags, filterTags),
			)
			.sort((left, right) => left.name.localeCompare(right.name));
		const skip = params.offset;
		const slice = active.slice(skip, skip + params.limit + 1);
		const hasMore = slice.length > params.limit;
		const pageRows = hasMore ? slice.slice(0, params.limit) : slice;

		return {
			establishments: pageRows.map((tenant) => ({
				id: tenant.id,
				name: tenant.name,
				slug: tenant.slug,
				logoUrl: tenant.logoUrl.trim() ? tenant.logoUrl.trim() : null,
				coverImageUrl: tenant.coverImageUrl.trim() ? tenant.coverImageUrl.trim() : null,
				tags: tenant.discoveryTags,
			})),
			hasMore,
		};
	}
}

async function main(): Promise<void> {
	const repository = new StubTenantRepository([tenantSuspended, tenantB, tenantBrunch, tenantA]);
	const list = new ListDiscoverableEstablishments(repository);

	const firstPage = await list.execute({ page: 0, limit: 1 });

	if (
		firstPage.establishments.length !== 1 ||
		firstPage.establishments[0]?.slug !== "alpha-cafe" ||
		firstPage.establishments[0]?.coverImageUrl !== "/uploads/tenants/alpha/cover.jpg" ||
		firstPage.establishments[0]?.tags?.join(",") !== "desayunos,cafe-autor" ||
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
		secondPage.establishments[0]?.coverImageUrl !== null ||
		(secondPage.establishments[0]?.tags ?? []).length > 0 ||
		!secondPage.hasMore
	) {
		console.error("❌ second page", secondPage);
		process.exit(1);
	}

	console.log("✅ second page + empty logoUrl/cover/tags → null/[]");

	const fallbackCover = resolveTenantCoverImageUrl(null);
	if (fallbackCover !== DEFAULT_TENANT_COVER_IMAGE_URL) {
		console.error("❌ empty cover should resolve to default", fallbackCover);
		process.exit(1);
	}

	console.log("✅ empty coverImageUrl → cafe_generico fallback");

	const all = await list.execute({ page: 0, limit: 10 });

	if (all.establishments.length !== 3 || all.hasMore) {
		console.error("❌ full page excludes suspended", all);
		process.exit(1);
	}

	console.log("✅ suspended tenants excluded");

	const filteredOne = await list.execute({ page: 0, limit: 10, tags: ["desayunos"] });

	if (
		filteredOne.establishments.length !== 1 ||
		filteredOne.establishments[0]?.slug !== "alpha-cafe"
	) {
		console.error("❌ filter single tag", filteredOne);
		process.exit(1);
	}

	console.log("✅ filter OR single tag");

	const filteredOr = await list.execute({
		page: 0,
		limit: 10,
		tags: ["desayunos", "brunch"],
	});

	if (filteredOr.establishments.length !== 2) {
		console.error("❌ filter OR multiple tags", filteredOr);
		process.exit(1);
	}

	const filteredSlugs = new Set(filteredOr.establishments.map((row) => row.slug));
	if (!filteredSlugs.has("alpha-cafe") || !filteredSlugs.has("brunch-house")) {
		console.error("❌ filter OR slugs", filteredSlugs);
		process.exit(1);
	}

	console.log("✅ filter OR multiple tags");

	try {
		parseDiscoverFilterTags(["invalid-tag"]);
		console.error("❌ expected InvalidDiscoverFilter");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof InvalidDiscoverFilter)) {
			console.error("❌ wrong error for invalid filter tag", error);
			process.exit(1);
		}
	}

	console.log("✅ invalid filter tag rejected");

	const manyTenants = Array.from({ length: 10 }, (_, index) => makeShopTenant(index + 1));
	const manyList = new ListDiscoverableEstablishments(new StubTenantRepository(manyTenants));
	const initialBatch = await manyList.execute({ offset: 0, limit: 6 });
	const nextBatch = await manyList.execute({ offset: 6, limit: 4 });

	if (initialBatch.establishments.length !== 6 || !initialBatch.hasMore) {
		console.error("❌ initial batch 6+4", initialBatch);
		process.exit(1);
	}

	if (nextBatch.establishments.length !== 4 || nextBatch.hasMore) {
		console.error("❌ next batch 6+4", nextBatch);
		process.exit(1);
	}

	const initialSlugs = new Set(initialBatch.establishments.map((row) => row.slug));
	const overlap = nextBatch.establishments.some((row) => initialSlugs.has(row.slug));

	if (overlap) {
		console.error("❌ offset batches overlap");
		process.exit(1);
	}

	console.log("✅ offset 0/6 + 6/4 without overlap");
	console.log("✅ verify:platform-app-discover-establishments-use-case passed");
}

void main();
