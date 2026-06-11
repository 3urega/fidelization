/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { CreateStampType } from "../src/contexts/loyalty/stamp_types/application/create/CreateStampType";
import { ListStampTypes } from "../src/contexts/loyalty/stamp_types/application/list/ListStampTypes";
import { UpdateStampType } from "../src/contexts/loyalty/stamp_types/application/update/UpdateStampType";
import { InvalidStampType } from "../src/contexts/loyalty/stamp_types/domain/InvalidStampType";
import { StampType } from "../src/contexts/loyalty/stamp_types/domain/StampType";
import { StampTypeForbidden } from "../src/contexts/loyalty/stamp_types/domain/StampTypeForbidden";
import { StampTypeNotFound } from "../src/contexts/loyalty/stamp_types/domain/StampTypeNotFound";
import { StampTypeRepository } from "../src/contexts/loyalty/stamp_types/domain/StampTypeRepository";
import { TenantRole } from "../src/contexts/tenants/memberships/domain/TenantRole";
import { Tenant } from "../src/contexts/tenants/tenants/domain/Tenant";
import { TenantNotFound } from "../src/contexts/tenants/tenants/domain/TenantNotFound";
import { TenantRepository } from "../src/contexts/tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../src/contexts/tenants/tenants/domain/TenantStatus";

const tenantId = "00000000-0000-4000-8000-0000000000h1";

const baseTenant = Tenant.fromPrimitives({
	id: tenantId,
	name: "Stamp Types Verify Cafe",
	slug: "stamp-types-verify-cafe",
	logoUrl: "",
	primaryColor: "#7C3AED",
	secondaryColor: "#4F46E5",
	subscriptionPlan: "FREE",
	subscriptionPlanId: null,
	status: TenantStatus.Active,
	createdAt: new Date().toISOString(),
});

class StubTenantRepository extends TenantRepository {
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
}

class InMemoryStampTypeRepository extends StampTypeRepository {
	private types = new Map<string, StampType>();

	async save(stampType: StampType): Promise<void> {
		this.types.set(stampType.id, stampType);
	}

	async searchById(tenantIdValue: string, id: string): Promise<StampType | null> {
		const row = this.types.get(id);

		return row && row.tenantId === tenantIdValue ? row : null;
	}

	async searchBySlug(tenantIdValue: string, slug: string): Promise<StampType | null> {
		return (
			Array.from(this.types.values()).find(
				(type) => type.tenantId === tenantIdValue && type.slug === slug,
			) ?? null
		);
	}

	async listByTenant(tenantIdValue: string): Promise<StampType[]> {
		return Array.from(this.types.values()).filter((type) => type.tenantId === tenantIdValue);
	}

	async listActiveByTenant(tenantIdValue: string): Promise<StampType[]> {
		return Array.from(this.types.values()).filter(
			(type) => type.tenantId === tenantIdValue && type.isActive,
		);
	}

	async countActiveByTenant(tenantIdValue: string): Promise<number> {
		return (await this.listActiveByTenant(tenantIdValue)).length;
	}

	async maxSortOrder(tenantIdValue: string): Promise<number> {
		const rows = await this.listByTenant(tenantIdValue);

		return rows.reduce((max, row) => Math.max(max, row.sortOrder), 0);
	}
}

async function expectForbidden(
	label: string,
	action: () => Promise<unknown>,
): Promise<void> {
	try {
		await action();
		console.error(`❌ expected StampTypeForbidden for ${label}`);
		process.exit(1);
	} catch (error) {
		if (!(error instanceof StampTypeForbidden)) {
			console.error(`❌ wrong error for ${label}`, error);
			process.exit(1);
		}
	}

	console.log(`✅ ${label} → StampTypeForbidden`);
}

async function main(): Promise<void> {
	const tenantRepository = new StubTenantRepository(baseTenant);
	const stampTypeRepository = new InMemoryStampTypeRepository();
	const create = new CreateStampType(tenantRepository, stampTypeRepository);
	const list = new ListStampTypes(tenantRepository, stampTypeRepository);
	const update = new UpdateStampType(tenantRepository, stampTypeRepository);

	await expectForbidden("CreateStampType employee", () =>
		create.execute({
			tenantId,
			role: TenantRole.Employee,
			input: { label: "Café" },
		}),
	);

	const cafe = await create.execute({
		tenantId,
		role: TenantRole.Owner,
		input: { label: "Café" },
	});
	const menu = await create.execute({
		tenantId,
		role: TenantRole.Owner,
		input: { label: "Menú" },
	});

	if (!cafe.isActive || cafe.slug !== "cafe" || menu.slug !== "menu") {
		console.error("❌ CreateStampType owner", cafe.toPrimitives(), menu.toPrimitives());
		process.exit(1);
	}

	console.log("✅ CreateStampType owner");

	const ownerTypes = await list.execute({ tenantId, role: TenantRole.Owner });

	if (ownerTypes.length !== 2) {
		console.error("❌ ListStampTypes owner", ownerTypes);
		process.exit(1);
	}

	console.log("✅ ListStampTypes owner");

	const employeeTypes = await list.execute({ tenantId, role: TenantRole.Employee });

	if (employeeTypes.length !== 2) {
		console.error("❌ ListStampTypes employee active only", employeeTypes);
		process.exit(1);
	}

	console.log("✅ ListStampTypes employee");

	await expectForbidden("UpdateStampType employee", () =>
		update.execute({
			tenantId,
			role: TenantRole.Employee,
			stampTypeId: cafe.id,
			input: { isActive: false },
		}),
	);

	const deactivated = await update.execute({
		tenantId,
		role: TenantRole.Owner,
		stampTypeId: cafe.id,
		input: { isActive: false },
	});

	if (deactivated.isActive) {
		console.error("❌ UpdateStampType deactivate", deactivated.toPrimitives());
		process.exit(1);
	}

	const employeeAfterDeactivate = await list.execute({ tenantId, role: TenantRole.Employee });

	if (employeeAfterDeactivate.length !== 1 || employeeAfterDeactivate[0]?.id !== menu.id) {
		console.error("❌ inactive type hidden from employee list", employeeAfterDeactivate);
		process.exit(1);
	}

	console.log("✅ UpdateStampType deactivate + employee list");

	try {
		await update.execute({
			tenantId,
			role: TenantRole.Owner,
			stampTypeId: "missing-id",
			input: { isActive: false },
		});
		console.error("❌ expected StampTypeNotFound");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof StampTypeNotFound)) {
			console.error("❌ wrong error for missing type", error);
			process.exit(1);
		}
	}

	console.log("✅ missing type → StampTypeNotFound");

	try {
		await update.execute({
			tenantId,
			role: TenantRole.Owner,
			stampTypeId: menu.id,
			input: { isActive: true },
		});
		console.error("❌ expected InvalidStampType for reactivation");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof InvalidStampType)) {
			console.error("❌ wrong error for invalid patch", error);
			process.exit(1);
		}
	}

	console.log("✅ invalid patch → InvalidStampType");

	try {
		await create.execute({
			tenantId,
			role: TenantRole.Owner,
			input: { label: "" },
		});
		console.error("❌ expected InvalidStampType for empty label");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof InvalidStampType)) {
			console.error("❌ wrong error for empty label", error);
			process.exit(1);
		}
	}

	console.log("✅ empty label → InvalidStampType");

	const missingTenantCreate = new CreateStampType(new StubTenantRepository(null), stampTypeRepository);

	try {
		await missingTenantCreate.execute({
			tenantId,
			role: TenantRole.Owner,
			input: { label: "X" },
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
	console.log("✅ verify:stamp-types-use-case passed");
}

void main();
