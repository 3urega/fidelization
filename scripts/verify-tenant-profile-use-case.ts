/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { TenantRole } from "../src/contexts/tenants/memberships/domain/TenantRole";
import { GeocodeAddressString } from "../src/contexts/shared/geocoding/application/geocode/GeocodeAddressString";
import { GeocodingGateway } from "../src/contexts/shared/geocoding/domain/GeocodingGateway";
import { Coordinates } from "../src/contexts/shared/geocoding/domain/Coordinates";
import { ApplyTenantGeocodingForAddress } from "../src/contexts/tenants/tenants/application/geocoding/ApplyTenantGeocodingForAddress";
import { UpdateTenantProfile } from "../src/contexts/tenants/tenants/application/update/UpdateTenantProfile";
import { InvalidTenantProfile } from "../src/contexts/tenants/tenants/domain/InvalidTenantProfile";
import { Tenant } from "../src/contexts/tenants/tenants/domain/Tenant";
import { TenantNotFound } from "../src/contexts/tenants/tenants/domain/TenantNotFound";
import { TenantProfileForbidden } from "../src/contexts/tenants/tenants/domain/TenantProfileForbidden";
import {
	TenantProfileUpdate,
	TENANT_ADDRESS_MAX_LENGTH,
	TENANT_DESCRIPTION_MAX_LENGTH,
} from "../src/contexts/tenants/tenants/domain/TenantProfileUpdate";
import { TenantRepository } from "../src/contexts/tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../src/contexts/tenants/tenants/domain/TenantStatus";

const tenantId = "00000000-0000-4000-8000-0000000000d1";

class NoopGeocodingGateway extends GeocodingGateway {
	async geocodeAddress(_address: string): Promise<Coordinates> {
		return Coordinates.fromPrimitives({ latitude: 40.4168, longitude: -3.7038 });
	}
}

function profileUseCase(repository: TenantRepository): UpdateTenantProfile {
	return new UpdateTenantProfile(
		repository,
		new ApplyTenantGeocodingForAddress(new GeocodeAddressString(new NoopGeocodingGateway())),
	);
}

const baseTenant = Tenant.fromPrimitives({
	id: tenantId,
	name: "Profile Verify Cafe",
	slug: "profile-verify-cafe",
	logoUrl: "",
	primaryColor: "#7C3AED",
	secondaryColor: "#4F46E5",
	subscriptionPlan: "FREE",
	subscriptionPlanId: null,
	status: TenantStatus.Active,
	address: "",
	description: "",
	createdAt: new Date().toISOString(),
});

class StubTenantRepository extends TenantRepository {
	constructor(
		private readonly tenant: Tenant | null,
		private readonly updated: Tenant | null,
	) {
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

		const primitives = this.tenant.toPrimitives();

		return (
			this.updated ??
			Tenant.fromPrimitives({
				...primitives,
				address: profile.address ?? primitives.address,
				description: profile.description ?? primitives.description,
				discoveryTags: profile.discoveryTags ?? primitives.discoveryTags,
			})
		);
	}

	async updateCoverImageUrl(_id: string, _coverImageUrl: string): Promise<Tenant | null> {
		return null;
	}
}

async function verifyForbidden(): Promise<void> {
	const useCase = profileUseCase(new StubTenantRepository(baseTenant, null));

	try {
		await useCase.execute({
			tenantId,
			role: TenantRole.Employee,
			profile: { address: "Calle Test 1" },
		});
		console.error("❌ expected TenantProfileForbidden for employee");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof TenantProfileForbidden)) {
			console.error("❌ wrong error for employee", error);
			process.exit(1);
		}
	}

	console.log("✅ employee role → TenantProfileForbidden");
}

async function verifyInvalidProfile(): Promise<void> {
	const useCase = profileUseCase(new StubTenantRepository(baseTenant, null));

	try {
		await useCase.execute({
			tenantId,
			role: TenantRole.Owner,
			profile: { address: "x".repeat(TENANT_ADDRESS_MAX_LENGTH + 1) },
		});
		console.error("❌ expected InvalidTenantProfile for long address");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof InvalidTenantProfile)) {
			console.error("❌ wrong error for long address", error);
			process.exit(1);
		}
	}

	try {
		await useCase.execute({
			tenantId,
			role: TenantRole.Owner,
			profile: { description: "x".repeat(TENANT_DESCRIPTION_MAX_LENGTH + 1) },
		});
		console.error("❌ expected InvalidTenantProfile for long description");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof InvalidTenantProfile)) {
			console.error("❌ wrong error for long description", error);
			process.exit(1);
		}
	}

	try {
		await useCase.execute({
			tenantId,
			role: TenantRole.Owner,
			profile: {},
		});
		console.error("❌ expected InvalidTenantProfile for empty body");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof InvalidTenantProfile)) {
			console.error("❌ wrong error for empty body", error);
			process.exit(1);
		}
	}

	console.log("✅ invalid profile → InvalidTenantProfile");
}

async function verifyTenantNotFound(): Promise<void> {
	const useCase = profileUseCase(new StubTenantRepository(null, null));

	try {
		await useCase.execute({
			tenantId: "missing-tenant",
			role: TenantRole.Owner,
			profile: { address: "Calle Test 1" },
		});
		console.error("❌ expected TenantNotFound");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof TenantNotFound)) {
			console.error("❌ wrong error for missing tenant", error);
			process.exit(1);
		}
	}

	console.log("✅ missing tenant → TenantNotFound");
}

async function verifyOwnerSuccessStub(): Promise<void> {
	const updated = Tenant.fromPrimitives({
		...baseTenant.toPrimitives(),
		address: "Calle Mayor 1, Madrid",
		description: "Café de barrio con tostadas artesanales.",
	});
	const useCase = profileUseCase(new StubTenantRepository(baseTenant, updated));

	const result = await useCase.execute({
		tenantId,
		role: TenantRole.Owner,
		profile: {
			address: "Calle Mayor 1, Madrid",
			description: "Café de barrio con tostadas artesanales.",
		},
	});
	const tenant = result.tenant;

	if (tenant.address !== "Calle Mayor 1, Madrid" || tenant.description !== updated.description) {
		console.error("❌ owner update did not return expected profile");
		process.exit(1);
	}

	console.log("✅ owner update → address + description");
}

async function verifyEmptyFieldsAllowed(): Promise<void> {
	const cleared = Tenant.fromPrimitives({
		...baseTenant.toPrimitives(),
		address: "",
		description: "",
	});
	const useCase = profileUseCase(new StubTenantRepository(baseTenant, cleared));

	const result = await useCase.execute({
		tenantId,
		role: TenantRole.Owner,
		profile: { address: "", description: "" },
	});
	const tenant = result.tenant;

	if (tenant.address !== "" || tenant.description !== "") {
		console.error("❌ empty strings should be allowed");
		process.exit(1);
	}

	console.log("✅ empty address/description allowed");
}

async function verifyDiscoveryTags(): Promise<void> {
	const updated = Tenant.fromPrimitives({
		...baseTenant.toPrimitives(),
		discoveryTags: ["desayunos", "brunch"],
	});
	const useCase = profileUseCase(new StubTenantRepository(baseTenant, updated));

	const result = await useCase.execute({
		tenantId,
		role: TenantRole.Owner,
		profile: { discoveryTags: ["desayunos", "brunch"] },
	});
	const tenant = result.tenant;

	if (tenant.discoveryTags.join(",") !== "desayunos,brunch") {
		console.error("❌ discoveryTags update failed", tenant.discoveryTags);
		process.exit(1);
	}

	try {
		await useCase.execute({
			tenantId,
			role: TenantRole.Owner,
			profile: { discoveryTags: ["invalid-tag"] },
		});
		console.error("❌ expected InvalidTenantProfile for invalid tag");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof InvalidTenantProfile)) {
			console.error("❌ wrong error for invalid tag", error);
			process.exit(1);
		}
	}

	console.log("✅ discoveryTags update + invalid tag rejected");
}

async function main(): Promise<void> {
	await verifyForbidden();
	await verifyInvalidProfile();
	await verifyTenantNotFound();
	await verifyOwnerSuccessStub();
	await verifyEmptyFieldsAllowed();
	await verifyDiscoveryTags();
	console.log("\n✅ verify-tenant-profile-use-case passed");
}

void main();
