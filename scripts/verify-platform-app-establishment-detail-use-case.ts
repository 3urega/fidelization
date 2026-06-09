/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { GetEstablishmentDetailForUser } from "../src/contexts/loyalty/customers/application/profile/GetEstablishmentDetailForUser";
import { ListActivePromotionsForCustomer } from "../src/contexts/loyalty/promotions/application/list/ListActivePromotionsForCustomer";
import { Promotion } from "../src/contexts/loyalty/promotions/domain/Promotion";
import { Customer } from "../src/contexts/loyalty/customers/domain/Customer";
import { CustomerRepository } from "../src/contexts/loyalty/customers/domain/CustomerRepository";
import { TenantAccessSuspended } from "../src/contexts/tenants/tenants/domain/TenantAccessSuspended";
import { TenantNotFound } from "../src/contexts/tenants/tenants/domain/TenantNotFound";
import { Tenant } from "../src/contexts/tenants/tenants/domain/Tenant";
import { TenantRepository } from "../src/contexts/tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../src/contexts/tenants/tenants/domain/TenantStatus";

class InMemoryTenantRepository extends TenantRepository {
	constructor(private readonly bySlug: Map<string, Tenant>) {
		super();
	}

	async findAll(): Promise<Tenant[]> {
		return Array.from(this.bySlug.values());
	}

	async findById(tenantId: string): Promise<Tenant | null> {
		for (const tenant of this.bySlug.values()) {
			if (tenant.id === tenantId) {
				return tenant;
			}
		}

		return null;
	}

	async findBySlug(slug: string): Promise<Tenant | null> {
		return this.bySlug.get(slug.trim().toLowerCase()) ?? null;
	}

	async updateStatus(): Promise<Tenant | null> {
		return null;
	}

	async updateBranding(): Promise<Tenant | null> {
		return null;
	}
}

class InMemoryCustomerRepository extends CustomerRepository {
	constructor(private readonly byKey: Map<string, Customer>) {
		super();
	}

	private key(userId: string, tenantId: string): string {
		return `${userId}:${tenantId}`;
	}

	async save(customer: Customer): Promise<void> {
		const p = customer.toPrimitives();
		if (p.userId) {
			this.byKey.set(this.key(p.userId, p.tenantId), customer);
		}
	}

	async searchById(): Promise<Customer | null> {
		return null;
	}

	async searchByQrValue(): Promise<Customer | null> {
		return null;
	}

	async searchByUserIdAndTenantId(userId: string, tenantId: string): Promise<Customer | null> {
		return this.byKey.get(this.key(userId, tenantId)) ?? null;
	}

	async listWithInteractionByUserId(): Promise<never[]> {
		return [];
	}
}

class StubListActivePromotionsForCustomer {
	async execute(): Promise<Promotion[]> {
		return [];
	}
}

const activeTenant = Tenant.fromPrimitives({
	id: "tenant-detail",
	name: "Detail Cafe",
	slug: "detail-cafe",
	logoUrl: "https://example.com/logo.png",
	primaryColor: "#112233",
	secondaryColor: "#ffffff",
	subscriptionPlan: "pro",
	subscriptionPlanId: "plan-pro",
	status: TenantStatus.Active,
	createdAt: new Date().toISOString(),
});

const suspendedTenant = Tenant.fromPrimitives({
	...activeTenant.toPrimitives(),
	id: "tenant-suspended",
	slug: "suspended-detail",
	status: TenantStatus.Suspended,
});

const userId = "user-detail-1";
const linkedCustomer = Customer.joinForPlatformUser({
	tenantId: activeTenant.id,
	userId,
	name: "Detail User",
	email: "detail@example.local",
});

const tenantRepo = new InMemoryTenantRepository(
	new Map([
		["detail-cafe", activeTenant],
		["suspended-detail", suspendedTenant],
	]),
);
const customerRepo = new InMemoryCustomerRepository(
	new Map([[`${userId}:${activeTenant.id}`, linkedCustomer]]),
);
const getDetail = new GetEstablishmentDetailForUser(
	tenantRepo,
	customerRepo,
	new StubListActivePromotionsForCustomer() as unknown as ListActivePromotionsForCustomer,
);

async function expectError<T extends Error>(
	label: string,
	action: () => Promise<unknown>,
	Expected: new (...args: never[]) => T,
): Promise<void> {
	try {
		await action();
		console.error(`❌ expected ${Expected.name} for ${label}`);
		process.exit(1);
	} catch (error) {
		if (!(error instanceof Expected)) {
			console.error(`❌ wrong error for ${label}:`, error);
			process.exit(1);
		}
	}
}

async function main(): Promise<void> {
	const discovery = await getDetail.execute({ userId: "user-without-link", slug: "detail-cafe" });
	if (discovery.mode !== "discovery" || discovery.customer !== null) {
		console.error("❌ expected discovery mode without customer");
		process.exit(1);
	}

	console.log("✅ discovery mode when no customer link");

	const interaction = await getDetail.execute({ userId, slug: "detail-cafe" });
	if (
		interaction.mode !== "interaction" ||
		!interaction.customer ||
		interaction.customer.id !== linkedCustomer.id
	) {
		console.error("❌ expected interaction mode with customer");
		process.exit(1);
	}

	console.log("✅ interaction mode when customer linked");

	await expectError("unknown slug", () => getDetail.execute({ userId, slug: "missing" }), TenantNotFound);

	console.log("✅ unknown slug → TenantNotFound");

	await expectError(
		"suspended tenant",
		() => getDetail.execute({ userId, slug: "suspended-detail" }),
		TenantAccessSuspended,
	);

	console.log("✅ suspended tenant → TenantAccessSuspended");

	console.log("✅ verify:platform-app-establishment-detail-use-case passed");
}

void main();
