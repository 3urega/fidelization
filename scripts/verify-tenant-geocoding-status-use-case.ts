/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { GeocodeAddressString } from "../src/contexts/shared/geocoding/application/geocode/GeocodeAddressString";
import { Coordinates } from "../src/contexts/shared/geocoding/domain/Coordinates";
import { GeocodingFailed } from "../src/contexts/shared/geocoding/domain/GeocodingFailed";
import { GeocodingGateway } from "../src/contexts/shared/geocoding/domain/GeocodingGateway";
import { GeocodingNotConfigured } from "../src/contexts/shared/geocoding/domain/GeocodingNotConfigured";
import { ApplyTenantGeocodingForAddress } from "../src/contexts/tenants/tenants/application/geocoding/ApplyTenantGeocodingForAddress";
import { RegeocodeTenantProfile } from "../src/contexts/tenants/tenants/application/update/RegeocodeTenantProfile";
import { UpdateTenantProfile } from "../src/contexts/tenants/tenants/application/update/UpdateTenantProfile";
import { TenantRole } from "../src/contexts/tenants/memberships/domain/TenantRole";
import { Tenant } from "../src/contexts/tenants/tenants/domain/Tenant";
import { TENANT_GEOCODING_STATUS } from "../src/contexts/tenants/tenants/domain/TenantGeocodingStatus";
import { TenantGeocodingAddressRequired } from "../src/contexts/tenants/tenants/domain/TenantGeocodingAddressRequired";
import type { TenantProfileUpdate } from "../src/contexts/tenants/tenants/domain/TenantProfileUpdate";
import { TenantRepository } from "../src/contexts/tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../src/contexts/tenants/tenants/domain/TenantStatus";

const tenantId = "00000000-0000-4000-8000-0000000000r1";
const STUB_LAT = 41.3874;
const STUB_LNG = 2.1686;

const baseTenant = Tenant.fromPrimitives({
	id: tenantId,
	name: "Geocoding Status Cafe",
	slug: "geocoding-status-cafe",
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

	constructor(private tenant: Tenant | null) {
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

		this.tenant = Tenant.fromPrimitives({
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

		return this.tenant;
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

class NotConfiguredGeocodingGateway extends GeocodingGateway {
	async geocodeAddress(_address: string): Promise<Coordinates> {
		throw new GeocodingNotConfigured("mapbox");
	}
}

function makeUpdateUseCase(
	repository: RecordingTenantRepository,
	gateway: GeocodingGateway,
): UpdateTenantProfile {
	return new UpdateTenantProfile(
		repository,
		new ApplyTenantGeocodingForAddress(new GeocodeAddressString(gateway)),
	);
}

function makeRegeocodeUseCase(
	repository: RecordingTenantRepository,
	gateway: GeocodingGateway,
): RegeocodeTenantProfile {
	return new RegeocodeTenantProfile(
		repository,
		new ApplyTenantGeocodingForAddress(new GeocodeAddressString(gateway)),
	);
}

async function verifyOkStatus(): Promise<void> {
	const repository = new RecordingTenantRepository(baseTenant);
	const result = await makeUpdateUseCase(repository, new SuccessGeocodingGateway()).execute({
		tenantId,
		role: TenantRole.Owner,
		profile: { address: "Carrer Major 10, Igualada" },
	});

	if (
		result.geocodingStatus !== TENANT_GEOCODING_STATUS.Ok ||
		!result.geocodingMessage ||
		result.tenant.latitude !== STUB_LAT
	) {
		console.error("❌ ok status", result);
		process.exit(1);
	}

	console.log("✅ address change → geocodingStatus ok");
}

async function verifyFailedStatus(): Promise<void> {
	const repository = new RecordingTenantRepository(baseTenant);
	const result = await makeUpdateUseCase(repository, new FailingGeocodingGateway()).execute({
		tenantId,
		role: TenantRole.Owner,
		profile: { address: "Unknown place XYZ" },
	});

	if (
		result.geocodingStatus !== TENANT_GEOCODING_STATUS.Failed ||
		!result.geocodingMessage?.includes("No pudimos ubicar") ||
		result.tenant.latitude !== null
	) {
		console.error("❌ failed status", result);
		process.exit(1);
	}

	console.log("✅ geocode failure → geocodingStatus failed + message");
}

async function verifyNotConfiguredMessage(): Promise<void> {
	const repository = new RecordingTenantRepository(baseTenant);
	const result = await makeUpdateUseCase(repository, new NotConfiguredGeocodingGateway()).execute({
		tenantId,
		role: TenantRole.Owner,
		profile: { address: "Plaça Catalunya, Barcelona" },
	});

	if (
		result.geocodingStatus !== TENANT_GEOCODING_STATUS.Failed ||
		!result.geocodingMessage?.includes("no disponible")
	) {
		console.error("❌ not configured message", result);
		process.exit(1);
	}

	console.log("✅ geocoding not configured → user-friendly failed message");
}

async function verifySkippedStatus(): Promise<void> {
	const repository = new RecordingTenantRepository(baseTenant);
	const unchanged = await makeUpdateUseCase(repository, new SuccessGeocodingGateway()).execute({
		tenantId,
		role: TenantRole.Owner,
		profile: { address: "Old Address 1", description: "Updated only" },
	});

	if (
		unchanged.geocodingStatus !== TENANT_GEOCODING_STATUS.Skipped ||
		unchanged.geocodingMessage !== undefined
	) {
		console.error("❌ skipped unchanged address", unchanged);
		process.exit(1);
	}

	const noAddressField = await makeUpdateUseCase(
		new RecordingTenantRepository(baseTenant),
		new SuccessGeocodingGateway(),
	).execute({
		tenantId,
		role: TenantRole.Owner,
		profile: { description: "Only description" },
	});

	if (noAddressField.geocodingStatus !== TENANT_GEOCODING_STATUS.Skipped) {
		console.error("❌ skipped when address omitted", noAddressField);
		process.exit(1);
	}

	console.log("✅ unchanged / omitted address → geocodingStatus skipped");
}

async function verifyClearedStatus(): Promise<void> {
	const withCoords = Tenant.fromPrimitives({
		...baseTenant.toPrimitives(),
		latitude: STUB_LAT,
		longitude: STUB_LNG,
		geocodingProvider: "mapbox",
		geocodedAt: new Date().toISOString(),
	});
	const repository = new RecordingTenantRepository(withCoords);
	const result = await makeUpdateUseCase(repository, new SuccessGeocodingGateway()).execute({
		tenantId,
		role: TenantRole.Owner,
		profile: { address: "" },
	});

	if (
		result.geocodingStatus !== TENANT_GEOCODING_STATUS.Cleared ||
		!result.geocodingMessage ||
		result.tenant.latitude !== null
	) {
		console.error("❌ cleared status", result);
		process.exit(1);
	}

	console.log("✅ empty address → geocodingStatus cleared");
}

async function verifyRegeocode(): Promise<void> {
	const repository = new RecordingTenantRepository(baseTenant);
	const regeocode = makeRegeocodeUseCase(repository, new SuccessGeocodingGateway());
	const result = await regeocode.execute({ tenantId, role: TenantRole.Owner });

	if (result.geocodingStatus !== TENANT_GEOCODING_STATUS.Ok || result.tenant.latitude !== STUB_LAT) {
		console.error("❌ regeocode success", result);
		process.exit(1);
	}

	console.log("✅ regeocode → geocodingStatus ok");
}

async function verifyRegeocodeRequiresAddress(): Promise<void> {
	const repository = new RecordingTenantRepository(
		Tenant.fromPrimitives({ ...baseTenant.toPrimitives(), address: "" }),
	);
	const regeocode = makeRegeocodeUseCase(repository, new SuccessGeocodingGateway());

	try {
		await regeocode.execute({ tenantId, role: TenantRole.Owner });
		console.error("❌ expected TenantGeocodingAddressRequired");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof TenantGeocodingAddressRequired)) {
			console.error("❌ wrong error for regeocode without address", error);
			process.exit(1);
		}
	}

	console.log("✅ regeocode without address → TenantGeocodingAddressRequired");
}

async function main(): Promise<void> {
	await verifyOkStatus();
	await verifyFailedStatus();
	await verifyNotConfiguredMessage();
	await verifySkippedStatus();
	await verifyClearedStatus();
	await verifyRegeocode();
	await verifyRegeocodeRequiresAddress();
	console.log("\n✅ verify-tenant-geocoding-status-use-case passed");
}

void main();
