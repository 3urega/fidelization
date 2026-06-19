/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { ListDiscoverableEstablishments } from "../src/contexts/tenants/tenants/application/list/ListDiscoverableEstablishments";
import {
	parseDiscoverNearFilter,
	DEFAULT_DISCOVER_NEAR_RADIUS_KM,
} from "../src/contexts/tenants/tenants/domain/DiscoverNearFilter";
import { InvalidDiscoverNearFilter } from "../src/contexts/tenants/tenants/domain/InvalidDiscoverNearFilter";
import {
	haversineDistanceKm,
	roundDistanceKm,
} from "../src/contexts/tenants/tenants/domain/haversineDistanceKm";
import { Tenant } from "../src/contexts/tenants/tenants/domain/Tenant";
import type { ListDiscoverableEstablishmentsParams } from "../src/contexts/tenants/tenants/domain/TenantRepository";
import { TenantRepository } from "../src/contexts/tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../src/contexts/tenants/tenants/domain/TenantStatus";
import {
	tenantMatchesDiscoverFilterTags,
} from "../src/contexts/tenants/tenants/domain/TenantDiscoveryTag";

const REFERENCE_LAT = 41.3874;
const REFERENCE_LNG = 2.1686;

const tenantNearA = Tenant.fromPrimitives({
	id: "00000000-0000-4000-8000-0000000000a1",
	name: "Near Alpha",
	slug: "near-alpha",
	logoUrl: "",
	primaryColor: "#7C3AED",
	secondaryColor: "#4F46E5",
	subscriptionPlan: "FREE",
	subscriptionPlanId: null,
	status: TenantStatus.Active,
	discoveryTags: ["desayunos"],
	latitude: 41.39,
	longitude: 2.17,
	createdAt: new Date().toISOString(),
});

const tenantNearB = Tenant.fromPrimitives({
	id: "00000000-0000-4000-8000-0000000000b2",
	name: "Near Beta",
	slug: "near-beta",
	logoUrl: "",
	primaryColor: "#7C3AED",
	secondaryColor: "#4F46E5",
	subscriptionPlan: "FREE",
	subscriptionPlanId: null,
	status: TenantStatus.Active,
	discoveryTags: ["brunch"],
	latitude: 41.45,
	longitude: 2.25,
	createdAt: new Date().toISOString(),
});

const tenantFar = Tenant.fromPrimitives({
	id: "00000000-0000-4000-8000-0000000000e5",
	name: "Far Establishment",
	slug: "far-establishment",
	logoUrl: "",
	primaryColor: "#7C3AED",
	secondaryColor: "#4F46E5",
	subscriptionPlan: "FREE",
	subscriptionPlanId: null,
	status: TenantStatus.Active,
	discoveryTags: [],
	latitude: 42.5,
	longitude: 2.8,
	createdAt: new Date().toISOString(),
});

const tenantNoCoords = Tenant.fromPrimitives({
	id: "00000000-0000-4000-8000-0000000000c3",
	name: "No Coords Cafe",
	slug: "no-coords-cafe",
	logoUrl: "",
	primaryColor: "#7C3AED",
	secondaryColor: "#4F46E5",
	subscriptionPlan: "FREE",
	subscriptionPlanId: null,
	status: TenantStatus.Active,
	latitude: null,
	longitude: null,
	createdAt: new Date().toISOString(),
});

const tenantSuspended = Tenant.fromPrimitives({
	id: "00000000-0000-4000-8000-0000000000d4",
	name: "Suspended Near",
	slug: "suspended-near",
	logoUrl: "",
	primaryColor: "#7C3AED",
	secondaryColor: "#4F46E5",
	subscriptionPlan: "FREE",
	subscriptionPlanId: null,
	status: TenantStatus.Suspended,
	latitude: 41.3874,
	longitude: 2.1686,
	createdAt: new Date().toISOString(),
});

class NearStubTenantRepository extends TenantRepository {
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

		if (params.near) {
			const near = params.near;
			const geocoded = this.activeTenants
				.filter((tenant) => tenant.status === TenantStatus.Active)
				.filter((tenant) => tenant.latitude !== null && tenant.longitude !== null)
				.filter((tenant) =>
					tenantMatchesDiscoverFilterTags(tenant.discoveryTags, filterTags),
				)
				.map((tenant) => ({
					tenant,
					distanceKm: roundDistanceKm(
						haversineDistanceKm(
							near.latitude,
							near.longitude,
							tenant.latitude!,
							tenant.longitude!,
						),
					),
				}))
				.sort((left, right) => {
					if (left.distanceKm !== right.distanceKm) {
						return left.distanceKm - right.distanceKm;
					}

					const byName = left.tenant.name.localeCompare(right.tenant.name);
					if (byName !== 0) {
						return byName;
					}

					return left.tenant.id.localeCompare(right.tenant.id);
				});

			const withoutCoords = this.activeTenants
				.filter((tenant) => tenant.status === TenantStatus.Active)
				.filter((tenant) => tenant.latitude === null || tenant.longitude === null)
				.filter((tenant) =>
					tenantMatchesDiscoverFilterTags(tenant.discoveryTags, filterTags),
				)
				.sort((left, right) => {
					const byName = left.name.localeCompare(right.name);
					if (byName !== 0) {
						return byName;
					}

					return left.id.localeCompare(right.id);
				});

			const combined = [
				...geocoded.map(({ tenant, distanceKm }) => ({ tenant, distanceKm })),
				...withoutCoords.map((tenant) => ({ tenant, distanceKm: undefined as number | undefined })),
			];

			const skip = params.offset;
			const slice = combined.slice(skip, skip + params.limit + 1);
			const hasMore = slice.length > params.limit;
			const pageRows = hasMore ? slice.slice(0, params.limit) : slice;

			return {
				establishments: pageRows.map(({ tenant, distanceKm }) => ({
					id: tenant.id,
					name: tenant.name,
					slug: tenant.slug,
					logoUrl: tenant.logoUrl.trim() ? tenant.logoUrl.trim() : null,
					coverImageUrl: tenant.coverImageUrl.trim() ? tenant.coverImageUrl.trim() : null,
					tags: tenant.discoveryTags,
					...(distanceKm !== undefined ? { distanceKm } : {}),
				})),
				hasMore,
			};
		}

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
	const repository = new NearStubTenantRepository([
		tenantSuspended,
		tenantNoCoords,
		tenantFar,
		tenantNearB,
		tenantNearA,
	]);
	const list = new ListDiscoverableEstablishments(repository);
	const nearFilter = {
		latitude: REFERENCE_LAT,
		longitude: REFERENCE_LNG,
		radiusKm: 25,
	};

	const nearResults = await list.execute({ offset: 0, limit: 10, near: nearFilter });

	if (nearResults.establishments.length !== 4) {
		console.error("❌ near mode should return all 4 active tenants (3 geocoded + no coords)", nearResults);
		process.exit(1);
	}

	if (
		nearResults.establishments[0]?.slug !== "near-alpha" ||
		nearResults.establishments[1]?.slug !== "near-beta" ||
		nearResults.establishments[2]?.slug !== "far-establishment" ||
		nearResults.establishments[3]?.slug !== "no-coords-cafe"
	) {
		console.error("❌ near mode should order geocoded by distance then no-coords alphabetically", nearResults);
		process.exit(1);
	}

	if (
		typeof nearResults.establishments[0]?.distanceKm !== "number" ||
		typeof nearResults.establishments[1]?.distanceKm !== "number" ||
		typeof nearResults.establishments[2]?.distanceKm !== "number"
	) {
		console.error("❌ geocoded tenants should include distanceKm", nearResults);
		process.exit(1);
	}

	if (nearResults.establishments[3]?.distanceKm !== undefined) {
		console.error("❌ tenants without coords must omit distanceKm in near mode");
		process.exit(1);
	}

	if (!nearResults.establishments.some((row) => row.slug === "far-establishment")) {
		console.error("❌ far tenant must appear even when radiusKm=25 (sort-only, no filter)");
		process.exit(1);
	}

	console.log("✅ near mode orders by distance with all establishments (radius ignored)");

	const nearTagged = await list.execute({
		offset: 0,
		limit: 10,
		near: nearFilter,
		tags: ["desayunos"],
	});

	if (
		nearTagged.establishments.length !== 1 ||
		nearTagged.establishments[0]?.slug !== "near-alpha"
	) {
		console.error("❌ near + tags filter", nearTagged);
		process.exit(1);
	}

	console.log("✅ near + tags filter");

	const legacy = await list.execute({ offset: 0, limit: 10 });

	if (
		legacy.establishments.length !== 4 ||
		legacy.establishments[0]?.slug !== "far-establishment" ||
		legacy.establishments[0]?.distanceKm !== undefined
	) {
		console.error("❌ legacy mode regression", legacy);
		process.exit(1);
	}

	console.log("✅ legacy mode without near (alphabetical, no distanceKm)");

	try {
		parseDiscoverNearFilter("41.5", null);
		console.error("❌ expected InvalidDiscoverNearFilter for partial coords");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof InvalidDiscoverNearFilter)) {
			console.error("❌ wrong error for partial coords", error);
			process.exit(1);
		}
	}

	try {
		parseDiscoverNearFilter("invalid", "2.17");
		console.error("❌ expected InvalidDiscoverNearFilter for invalid lat");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof InvalidDiscoverNearFilter)) {
			console.error("❌ wrong error for invalid lat", error);
			process.exit(1);
		}
	}

	const defaultRadius = parseDiscoverNearFilter(String(REFERENCE_LAT), String(REFERENCE_LNG));
	if (defaultRadius?.radiusKm !== DEFAULT_DISCOVER_NEAR_RADIUS_KM) {
		console.error("❌ default radiusKm", defaultRadius);
		process.exit(1);
	}

	console.log("✅ parseDiscoverNearFilter validation");
	console.log("✅ verify:discover-establishments-near-use-case passed");
}

void main();
