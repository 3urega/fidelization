/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { AuthenticateCustomerByQr } from "../src/contexts/loyalty/customers/application/authenticate/AuthenticateCustomerByQr";
import { RegisterCustomer } from "../src/contexts/loyalty/customers/application/register/RegisterCustomer";
import { CustomerSessionVerifier } from "../src/contexts/loyalty/customers/application/verify/CustomerSessionVerifier";
import { Customer } from "../src/contexts/loyalty/customers/domain/Customer";
import { CustomerNotFound } from "../src/contexts/loyalty/customers/domain/CustomerNotFound";
import { CustomerRepository } from "../src/contexts/loyalty/customers/domain/CustomerRepository";
import { InvalidCustomerSession } from "../src/contexts/loyalty/customers/domain/InvalidCustomerSession";
import { PrismaCustomerRepository } from "../src/contexts/loyalty/customers/infrastructure/PrismaCustomerRepository";
import { CrossTenantAccessDenied } from "../src/contexts/tenants/memberships/domain/CrossTenantAccessDenied";
import { TenantAccessSuspended } from "../src/contexts/tenants/tenants/domain/TenantAccessSuspended";
import { Tenant } from "../src/contexts/tenants/tenants/domain/Tenant";
import { TenantNotFound } from "../src/contexts/tenants/tenants/domain/TenantNotFound";
import { TenantRepository } from "../src/contexts/tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../src/contexts/tenants/tenants/domain/TenantStatus";
import { PrismaTenantRepository } from "../src/contexts/tenants/tenants/infrastructure/PrismaTenantRepository";
import { DEMO_TENANT_ID } from "../src/lib/tenant/mockTenantBySlug";
import { prisma } from "../src/lib/prisma";

const activeTenantId = "00000000-0000-4000-8000-0000000000c2";
const suspendedTenantId = "00000000-0000-4000-8000-0000000000c3";
const demoQrValue = "demo-qr-use-case";

const activeTenant = Tenant.fromPrimitives({
	id: activeTenantId,
	name: "Customer Use Case Cafe",
	slug: "customer-use-case",
	logoUrl: "",
	primaryColor: "#7C3AED",
	secondaryColor: "#4F46E5",
	subscriptionPlan: "FREE",
	subscriptionPlanId: null,
	status: TenantStatus.Active,
	createdAt: new Date().toISOString(),
});

const suspendedTenant = Tenant.fromPrimitives({
	...activeTenant.toPrimitives(),
	id: suspendedTenantId,
	name: "Suspended Cafe",
	slug: "suspended-cafe",
	status: TenantStatus.Suspended,
});

const seededCustomer = Customer.fromPrimitives({
	id: "00000000-0000-4000-8000-0000000000d1",
	tenantId: activeTenantId,
	name: "Demo QR Customer",
	email: null,
	phone: null,
	qrValue: demoQrValue,
	pointsBalance: 5,
	visitsCount: 1,
});

class StubTenantRepository extends TenantRepository {
	constructor(private readonly tenants: Map<string, Tenant>) {
		super();
	}

	async findAll(): Promise<Tenant[]> {
		return Array.from(this.tenants.values());
	}

	async findById(id: string): Promise<Tenant | null> {
		return this.tenants.get(id) ?? null;
	}

	async updateStatus(): Promise<Tenant | null> {
		return null;
	}

	async updateBranding(): Promise<Tenant | null> {
		return null;
	}
}

class StubCustomerRepository extends CustomerRepository {
	constructor(private readonly customers: Customer[]) {
		super();
	}

	async save(customer: Customer): Promise<void> {
		const index = this.customers.findIndex((row) => row.id === customer.id);
		if (index >= 0) {
			this.customers[index] = customer;
		} else {
			this.customers.push(customer);
		}
	}

	async searchById(tenantId: string, id: string): Promise<Customer | null> {
		return this.customers.find((row) => row.tenantId === tenantId && row.id === id) ?? null;
	}

	async searchByQrValue(tenantId: string, qrValue: string): Promise<Customer | null> {
		return (
			this.customers.find((row) => row.tenantId === tenantId && row.qrValue === qrValue) ?? null
		);
	}
}

async function verifyRegisterAndAuthStub(): Promise<void> {
	const tenantRepo = new StubTenantRepository(
		new Map([
			[activeTenantId, activeTenant],
			[suspendedTenantId, suspendedTenant],
		]),
	);
	const customerRepo = new StubCustomerRepository([seededCustomer]);
	const register = new RegisterCustomer(tenantRepo, customerRepo);
	const authByQr = new AuthenticateCustomerByQr(tenantRepo, customerRepo);

	const created = await register.execute({
		tenantId: activeTenantId,
		name: "New Loyalty Customer",
	});
	if (!created.qrValue || created.tenantId !== activeTenantId) {
		console.error("❌ RegisterCustomer stub");
		process.exit(1);
	}

	const authenticated = await authByQr.execute({
		tenantId: activeTenantId,
		qrValue: demoQrValue,
	});
	if (authenticated.id !== seededCustomer.id) {
		console.error("❌ AuthenticateCustomerByQr stub");
		process.exit(1);
	}

	try {
		await register.execute({ tenantId: suspendedTenantId, name: "Blocked" });
		console.error("❌ expected TenantAccessSuspended on register");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof TenantAccessSuspended)) {
			console.error("❌ wrong error suspended register", error);
			process.exit(1);
		}
	}

	try {
		await authByQr.execute({ tenantId: activeTenantId, qrValue: "missing-qr" });
		console.error("❌ expected CustomerNotFound");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof CustomerNotFound)) {
			console.error("❌ wrong error missing qr", error);
			process.exit(1);
		}
	}

	console.log("✅ RegisterCustomer + AuthenticateCustomerByQr (stub)");
}

async function verifySessionVerifierStub(): Promise<void> {
	const tenantRepo = new StubTenantRepository(new Map([[activeTenantId, activeTenant]]));
	const customerRepo = new StubCustomerRepository([seededCustomer]);
	const verifier = new CustomerSessionVerifier(tenantRepo, customerRepo);

	const ok = await verifier.verify(
		{ kind: "customer", customerId: seededCustomer.id, tenantId: activeTenantId },
		activeTenantId,
	);
	if (!ok || ok.id !== seededCustomer.id) {
		console.error("❌ CustomerSessionVerifier ok path");
		process.exit(1);
	}

	try {
		await verifier.verify(
			{ kind: "tenant", userId: "u1", tenantId: activeTenantId, role: "owner" },
			activeTenantId,
		);
		console.error("❌ expected InvalidCustomerSession for tenant session");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof InvalidCustomerSession)) {
			console.error("❌ wrong error invalid session kind", error);
			process.exit(1);
		}
	}

	try {
		await verifier.verify(
			{ kind: "customer", customerId: seededCustomer.id, tenantId: activeTenantId },
			"other-tenant",
		);
		console.error("❌ expected CrossTenantAccessDenied");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof CrossTenantAccessDenied)) {
			console.error("❌ wrong error cross-tenant", error);
			process.exit(1);
		}
	}

	console.log("✅ CustomerSessionVerifier (stub)");
}

async function verifyPrismaPath(): Promise<void> {
	if (!process.env.DATABASE_URL) {
		console.log("✅ verify:customer-use-case passed (stub only, no DATABASE_URL)");

		return;
	}

	const tenantRow =
		(await prisma.tenant.findFirst({ where: { id: DEMO_TENANT_ID }, select: { id: true } })) ??
		(await prisma.tenant.findFirst({ select: { id: true } }));

	if (!tenantRow) {
		console.log("✅ verify:customer-use-case passed (stub only, no tenant row)");

		return;
	}

	const tenantRepo = new PrismaTenantRepository();
	const customerRepo = new PrismaCustomerRepository();
	const register = new RegisterCustomer(tenantRepo, customerRepo);

	const customer = await register.execute({
		tenantId: tenantRow.id,
		name: `Prisma Verify ${Date.now()}`,
	});

	const loaded = await customerRepo.searchById(tenantRow.id, customer.id);
	if (!loaded || loaded.qrValue !== customer.qrValue) {
		console.error("❌ Prisma RegisterCustomer");
		process.exit(1);
	}

	const verifier = new CustomerSessionVerifier(tenantRepo, customerRepo);
	const verified = await verifier.verify(
		{ kind: "customer", customerId: customer.id, tenantId: tenantRow.id },
		tenantRow.id,
	);
	if (verified.id !== customer.id) {
		console.error("❌ Prisma CustomerSessionVerifier");
		process.exit(1);
	}

	const missingTenantRegister = new RegisterCustomer(tenantRepo, customerRepo);
	try {
		await missingTenantRegister.execute({
			tenantId: "00000000-0000-4000-8000-000000009999",
			name: "No Tenant",
		});
		console.error("❌ expected TenantNotFound on Prisma register");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof TenantNotFound)) {
			console.error("❌ wrong Prisma tenant not found", error);
			process.exit(1);
		}
	}

	await prisma.customer.delete({ where: { id: customer.id } });

	console.log("✅ RegisterCustomer + CustomerSessionVerifier (Prisma)");
	console.log("✅ verify:customer-use-case passed");
}

async function main(): Promise<void> {
	await verifyRegisterAndAuthStub();
	await verifySessionVerifierStub();
	await verifyPrismaPath();
}

void main();
