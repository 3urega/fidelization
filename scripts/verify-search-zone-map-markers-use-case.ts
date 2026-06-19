/* eslint-disable no-console -- CLI verify script */
import { ListEstablishmentMapMarkersNearPoint } from "../src/contexts/tenants/tenants/application/list/ListEstablishmentMapMarkersNearPoint";
import type { DiscoverNearFilter } from "../src/contexts/tenants/tenants/domain/DiscoverNearFilter";
import type { EstablishmentMapMarker } from "../src/contexts/tenants/tenants/domain/EstablishmentMapMarker";
import {
	haversineDistanceKm,
	roundDistanceKm,
} from "../src/contexts/tenants/tenants/domain/haversineDistanceKm";
import { Tenant } from "../src/contexts/tenants/tenants/domain/Tenant";
import { TenantRepository } from "../src/contexts/tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../src/contexts/tenants/tenants/domain/TenantStatus";

const REFERENCE_LAT = 41.3874;
const REFERENCE_LNG = 2.1686;

const tenantNearA = Tenant.fromPrimitives({
	id: "00000000-0000-4000-8000-0000000000a1",
	name: "Near Alpha",
	slug: "near-alpha",
	logoUrl: "https://example.com/a.png",
	primaryColor: "#7C3AED",
	secondaryColor: "#4F46E5",
	subscriptionPlan: "FREE",
	subscriptionPlanId: null,
	status: TenantStatus.Active,
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

class MapMarkersStubTenantRepository extends TenantRepository {
	constructor(private readonly tenants: Tenant[]) {
		super();
	}

	async findAll(): Promise<Tenant[]> {
		return this.tenants;
	}

	async findById(id: string): Promise<Tenant | null> {
		return this.tenants.find((tenant) => tenant.id === id) ?? null;
	}

	async updateStatus(): Promise<Tenant | null> {
		return null;
	}

	async updateBranding(): Promise<Tenant | null> {
		return null;
	}

	async listEstablishmentMapMarkersNear(
		near: DiscoverNearFilter,
		limit = 50,
	): Promise<EstablishmentMapMarker[]> {
		return this.tenants
			.filter((tenant) => tenant.status === TenantStatus.Active)
			.filter((tenant) => tenant.latitude !== null && tenant.longitude !== null)
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
			.filter((row) => row.distanceKm <= near.radiusKm)
			.sort((left, right) => {
				if (left.distanceKm !== right.distanceKm) {
					return left.distanceKm - right.distanceKm;
				}

				return left.tenant.name.localeCompare(right.tenant.name);
			})
			.slice(0, limit)
			.map(({ tenant }) => {
				const logoUrl = tenant.logoUrl.trim();

				return {
					id: tenant.id,
					slug: tenant.slug,
					name: tenant.name,
					latitude: tenant.latitude!,
					longitude: tenant.longitude!,
					...(logoUrl ? { logoUrl } : {}),
				};
			});
	}
}

async function main(): Promise<void> {
	const repository = new MapMarkersStubTenantRepository([
		tenantSuspended,
		tenantNoCoords,
		tenantNearB,
		tenantNearA,
	]);
	const useCase = new ListEstablishmentMapMarkersNearPoint(repository);

	const nearFilter = {
		latitude: REFERENCE_LAT,
		longitude: REFERENCE_LNG,
		radiusKm: 50,
	};

	const result = await useCase.execute({ near: nearFilter });

	if (result.markers.length !== 2) {
		console.error("❌ expected 2 map markers", result);
		process.exit(1);
	}

	console.log("✅ returns geocoded active tenants only");

	if (result.markers[0]?.slug !== "near-alpha" || result.markers[1]?.slug !== "near-beta") {
		console.error("❌ markers should be ordered by distance", result.markers);
		process.exit(1);
	}

	console.log("✅ markers ordered by distance");

	const first = result.markers[0];
	if (
		!first ||
		typeof first.latitude !== "number" ||
		typeof first.longitude !== "number" ||
		first.logoUrl !== "https://example.com/a.png"
	) {
		console.error("❌ marker shape invalid", first);
		process.exit(1);
	}

	const second = result.markers[1];
	if (!second || second.logoUrl !== undefined) {
		console.error("❌ empty logoUrl should be omitted", second);
		process.exit(1);
	}

	console.log("✅ marker includes lat/lng and optional logoUrl");

	const tightRadius = await useCase.execute({
		near: { latitude: REFERENCE_LAT, longitude: REFERENCE_LNG, radiusKm: 1 },
	});

	if (tightRadius.markers.length !== 1 || tightRadius.markers[0]?.slug !== "near-alpha") {
		console.error("❌ tight radius should exclude far tenant", tightRadius);
		process.exit(1);
	}

	console.log("✅ radius filter applied");
	console.log("✅ verify:search-zone-map-markers-use-case passed");
}

void main();
