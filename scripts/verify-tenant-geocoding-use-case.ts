/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { GeocodeAddressString } from "../src/contexts/shared/geocoding/application/geocode/GeocodeAddressString";
import { Coordinates } from "../src/contexts/shared/geocoding/domain/Coordinates";
import { GeocodingFailed } from "../src/contexts/shared/geocoding/domain/GeocodingFailed";
import { GeocodingGateway } from "../src/contexts/shared/geocoding/domain/GeocodingGateway";
import { GeocodingResult } from "../src/contexts/shared/geocoding/domain/GeocodingResult";
import { TenantRole } from "../src/contexts/tenants/memberships/domain/TenantRole";
import { UpdateTenantProfile } from "../src/contexts/tenants/tenants/application/update/UpdateTenantProfile";
import { Tenant } from "../src/contexts/tenants/tenants/domain/Tenant";
import {
	type TenantProfileUpdate,
	TENANT_ADDRESS_MAX_LENGTH,
} from "../src/contexts/tenants/tenants/domain/TenantProfileUpdate";
import { TenantRepository } from "../src/contexts/tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../src/contexts/tenants/tenants/domain/TenantStatus";

const tenantId = "00000000-0000-4000-8000-0000000000g1";
const STUB_LAT = 41.3874;
const STUB_LNG = 2.1686;

const baseTenant = Tenant.fromPrimitives({
	id: tenantId,
	name: "Geocoding Verify Cafe",
	slug: "geocoding-verify-cafe",
	logoUrl: "",
	primaryColor: "#7C3AED",
	secondaryColor: "#4F46E5",
	subscriptionPlan: "FREE",
	subscriptionPlanId: null,
	status: TenantStatus.Active,
	address: "Old Address 1",
	description: "",
	createdAt: new Date().toISOString(),
});

class RecordingTenantRepository extends TenantRepository {
	public lastProfileUpdate: TenantProfileUpdate | null = null;

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

	async updateBranding(): Promise<Tenant | null> {
		return null;
	}

	async updateProfile(id: string, profile: TenantProfileUpdate): Promise<Tenant | null> {
		if (!this.tenant || id !== this.tenant.id) {
			return null;
		}

		this.lastProfileUpdate = profile;
		const primitives = this.tenant.toPrimitives();

		return Tenant.fromPrimitives({
			...primitives,
			address: profile.address ?? primitives.address,
			description: profile.description ?? primitives.description,
			discoveryTags: profile.discoveryTags ?? primitives.discoveryTags,
			latitude:
				profile.geolocation === undefined
					? (primitives.latitude ?? null)
					: (profile.geolocation?.latitude ?? null),
			longitude:
				profile.geolocation === undefined
					? (primitives.longitude ?? null)
					: (profile.geolocation?.longitude ?? null),
			geocodingProvider:
				profile.geolocation === undefined
					? (primitives.geocodingProvider ?? null)
					: (profile.geolocation?.geocodingProvider ?? null),
			geocodedAt:
				profile.geolocation === undefined
					? (primitives.geocodedAt ?? null)
					: (profile.geolocation?.geocodedAt.toISOString() ?? null),
		});
	}

	async updateCoverImageUrl(): Promise<Tenant | null> {
		return null;
	}
}

class SuccessGeocodingGateway extends GeocodingGateway {
	async geocodeAddress(_address: string): Promise<Coordinates> {
		return Coordinates.fromPrimitives({ latitude: STUB_LAT, longitude: STUB_LNG });
	}
}

class FailingGeocodingGateway extends GeocodingGateway {
	async geocodeAddress(_address: string): Promise<Coordinates> {
		throw new GeocodingFailed("No results");
	}
}

function makeGeocodeUseCase(gateway: GeocodingGateway): GeocodeAddressString {
	return new GeocodeAddressString(gateway);
}

async function verifyAddressChangeGeocodes(): Promise<void> {
	const repository = new RecordingTenantRepository(baseTenant);
	const useCase = new UpdateTenantProfile(repository, makeGeocodeUseCase(new SuccessGeocodingGateway()));

	const tenant = await useCase.execute({
		tenantId,
		role: TenantRole.Owner,
		profile: { address: "Carrer Major 10, Igualada" },
	});

	if (
		tenant.address !== "Carrer Major 10, Igualada" ||
		tenant.latitude !== STUB_LAT ||
		tenant.longitude !== STUB_LNG ||
		repository.lastProfileUpdate?.geolocation?.latitude !== STUB_LAT
	) {
		console.error("❌ address change geocoding", tenant.toPrimitives(), repository.lastProfileUpdate);
		process.exit(1);
	}

	console.log("✅ address change → geocoded coordinates persisted");
}

async function verifyUnchangedAddressSkipsGeocode(): Promise<void> {
	const repository = new RecordingTenantRepository(baseTenant);
	const useCase = new UpdateTenantProfile(repository, makeGeocodeUseCase(new SuccessGeocodingGateway()));

	await useCase.execute({
		tenantId,
		role: TenantRole.Owner,
		profile: { address: "Old Address 1", description: "Updated only" },
	});

	if (repository.lastProfileUpdate?.geolocation !== undefined) {
		console.error("❌ unchanged address should not set geolocation", repository.lastProfileUpdate);
		process.exit(1);
	}

	console.log("✅ unchanged address → geolocation omitted");
}

async function verifyEmptyAddressClearsCoords(): Promise<void> {
	const withCoords = Tenant.fromPrimitives({
		...baseTenant.toPrimitives(),
		latitude: STUB_LAT,
		longitude: STUB_LNG,
		geocodingProvider: "mapbox",
		geocodedAt: new Date().toISOString(),
	});
	const repository = new RecordingTenantRepository(withCoords);
	const useCase = new UpdateTenantProfile(repository, makeGeocodeUseCase(new SuccessGeocodingGateway()));

	const tenant = await useCase.execute({
		tenantId,
		role: TenantRole.Owner,
		profile: { address: "" },
	});

	if (tenant.address !== "" || tenant.latitude !== null || repository.lastProfileUpdate?.geolocation !== null) {
		console.error("❌ empty address should clear geolocation", tenant.toPrimitives(), repository.lastProfileUpdate);
		process.exit(1);
	}

	console.log("✅ empty address → geolocation cleared");
}

async function verifyGeocodeFailureStillSavesAddress(): Promise<void> {
	const repository = new RecordingTenantRepository(baseTenant);
	const useCase = new UpdateTenantProfile(repository, makeGeocodeUseCase(new FailingGeocodingGateway()));

	const tenant = await useCase.execute({
		tenantId,
		role: TenantRole.Owner,
		profile: { address: "Unknown place XYZ" },
	});

	if (
		tenant.address !== "Unknown place XYZ" ||
		tenant.latitude !== null ||
		repository.lastProfileUpdate?.geolocation !== null
	) {
		console.error("❌ geocode failure should save address with null coords", tenant.toPrimitives());
		process.exit(1);
	}

	console.log("✅ geocode failure → address saved, coords null");
}

async function verifyLongAddressStillValidated(): Promise<void> {
	const repository = new RecordingTenantRepository(baseTenant);
	const useCase = new UpdateTenantProfile(repository, makeGeocodeUseCase(new SuccessGeocodingGateway()));

	try {
		await useCase.execute({
			tenantId,
			role: TenantRole.Owner,
			profile: { address: "x".repeat(TENANT_ADDRESS_MAX_LENGTH + 1) },
		});
		console.error("❌ expected InvalidTenantProfile for long address");
		process.exit(1);
	} catch {
		console.log("✅ long address still rejected before geocoding");
	}
}

async function main(): Promise<void> {
	await verifyAddressChangeGeocodes();
	await verifyUnchangedAddressSkipsGeocode();
	await verifyEmptyAddressClearsCoords();
	await verifyGeocodeFailureStillSavesAddress();
	await verifyLongAddressStillValidated();
	console.log("\n✅ verify-tenant-geocoding-use-case passed");
}

void main();
