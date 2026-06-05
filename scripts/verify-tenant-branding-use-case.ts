/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { TenantRole } from "../src/contexts/tenants/memberships/domain/TenantRole";
import { UpdateTenantBranding } from "../src/contexts/tenants/tenants/application/update/UpdateTenantBranding";
import { InvalidTenantBranding } from "../src/contexts/tenants/tenants/domain/InvalidTenantBranding";
import { Tenant } from "../src/contexts/tenants/tenants/domain/Tenant";
import { TenantBrandingForbidden } from "../src/contexts/tenants/tenants/domain/TenantBrandingForbidden";
import { TenantBrandingUpdate } from "../src/contexts/tenants/tenants/domain/TenantBrandingUpdate";
import { TenantNotFound } from "../src/contexts/tenants/tenants/domain/TenantNotFound";
import { TenantRepository } from "../src/contexts/tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../src/contexts/tenants/tenants/domain/TenantStatus";
import { PrismaTenantRepository } from "../src/contexts/tenants/tenants/infrastructure/PrismaTenantRepository";
import { prisma } from "../src/lib/prisma";

const tenantId = "00000000-0000-4000-8000-0000000000b1";

const baseTenant = Tenant.fromPrimitives({
	id: tenantId,
	name: "Branding Verify Cafe",
	slug: "branding-verify-cafe",
	logoUrl: "",
	primaryColor: "#7C3AED",
	secondaryColor: "#4F46E5",
	subscriptionPlan: "FREE",
	status: TenantStatus.Active,
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

	async updateBranding(id: string, branding: TenantBrandingUpdate): Promise<Tenant | null> {
		if (!this.tenant || id !== this.tenant.id) {
			return null;
		}

		const primitives = this.tenant.toPrimitives();

		return (
			this.updated ??
			Tenant.fromPrimitives({
				...primitives,
				logoUrl: branding.logoUrl ?? primitives.logoUrl,
				primaryColor: branding.primaryColor ?? primitives.primaryColor,
				secondaryColor: branding.secondaryColor ?? primitives.secondaryColor,
			})
		);
	}
}

async function verifyForbidden(): Promise<void> {
	const useCase = new UpdateTenantBranding(new StubTenantRepository(baseTenant, null));

	try {
		await useCase.execute({
			tenantId,
			role: TenantRole.Employee,
			branding: { primaryColor: "#111111" },
		});
		console.error("❌ expected TenantBrandingForbidden for employee");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof TenantBrandingForbidden)) {
			console.error("❌ wrong error for employee", error);
			process.exit(1);
		}
	}

	console.log("✅ employee role → TenantBrandingForbidden");
}

async function verifyInvalidBranding(): Promise<void> {
	const useCase = new UpdateTenantBranding(new StubTenantRepository(baseTenant, null));

	try {
		await useCase.execute({
			tenantId,
			role: TenantRole.Owner,
			branding: { primaryColor: "red" },
		});
		console.error("❌ expected InvalidTenantBranding");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof InvalidTenantBranding)) {
			console.error("❌ wrong error for invalid color", error);
			process.exit(1);
		}
	}

	console.log("✅ invalid color → InvalidTenantBranding");
}

async function verifyTenantNotFound(): Promise<void> {
	const useCase = new UpdateTenantBranding(new StubTenantRepository(null, null));

	try {
		await useCase.execute({
			tenantId: "missing-tenant",
			role: TenantRole.Owner,
			branding: { primaryColor: "#111111" },
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
		primaryColor: "#ABCDEF",
	});
	const useCase = new UpdateTenantBranding(new StubTenantRepository(baseTenant, updated));

	const tenant = await useCase.execute({
		tenantId,
		role: TenantRole.Owner,
		branding: { primaryColor: "#ABCDEF" },
	});

	if (tenant.primaryColor !== "#ABCDEF") {
		console.error("❌ owner update did not return expected color");
		process.exit(1);
	}

	console.log("✅ owner update (stub repository)");
}

async function verifyOwnerSuccessPrisma(): Promise<void> {
	if (!process.env.DATABASE_URL) {
		console.log("✅ verify:tenant-branding-use-case passed (stub only, no DATABASE_URL)");

		return;
	}

	const row = await prisma.tenant.findFirst({ select: { id: true, primaryColor: true } });
	if (!row) {
		console.log("✅ verify:tenant-branding-use-case passed (no tenant row in DB)");

		return;
	}

	const useCase = new UpdateTenantBranding(new PrismaTenantRepository());
	const original = row.primaryColor;

	const tenant = await useCase.execute({
		tenantId: row.id,
		role: TenantRole.Owner,
		branding: { primaryColor: "#333333" },
	});

	if (tenant.primaryColor !== "#333333") {
		console.error("❌ Prisma owner update failed");
		process.exit(1);
	}

	await useCase.execute({
		tenantId: row.id,
		role: TenantRole.Owner,
		branding: { primaryColor: original },
	});

	console.log("✅ owner update (Prisma repository)");
	console.log("✅ verify:tenant-branding-use-case passed");
}

async function main(): Promise<void> {
	await verifyForbidden();
	await verifyInvalidBranding();
	await verifyTenantNotFound();
	await verifyOwnerSuccessStub();
	await verifyOwnerSuccessPrisma();
}

void main();
