/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { Customer } from "../src/contexts/loyalty/customers/domain/Customer";
import { PrismaCustomerRepository } from "../src/contexts/loyalty/customers/infrastructure/PrismaCustomerRepository";
import { createSessionToken, verifySessionToken } from "../src/lib/auth/session";
import {
	isCustomerSession,
	parseSessionPayload,
} from "../src/lib/auth/sessionClaims";
import { verifySessionTokenEdge } from "../src/lib/auth/middlewareSession";
import { DEMO_TENANT_ID } from "../src/lib/tenant/mockTenantBySlug";
import { prisma } from "../src/lib/prisma";

const factoryTenantId = "00000000-0000-4000-8000-0000000000c1";

async function verifyJwtRoundTrip(): Promise<void> {
	const token = await createSessionToken({
		kind: "customer",
		customerId: "customer-verify-1",
		tenantId: "tenant-verify-1",
	});
	const session = await verifySessionToken(token);

	if (!session || !isCustomerSession(session)) {
		console.error("❌ customer session round-trip failed");
		process.exit(1);
	}

	if (session.customerId !== "customer-verify-1" || session.tenantId !== "tenant-verify-1") {
		console.error("❌ customer session claims mismatch", session);
		process.exit(1);
	}

	const edgeSession = await verifySessionTokenEdge(token);
	if (!edgeSession || !isCustomerSession(edgeSession)) {
		console.error("❌ customer session edge verify failed");
		process.exit(1);
	}

	const parsed = parseSessionPayload({
		kind: "customer",
		sub: "customer-parse",
		tenantId: "tenant-parse",
	});

	if (!parsed || !isCustomerSession(parsed) || parsed.customerId !== "customer-parse") {
		console.error("❌ parseSessionPayload customer failed", parsed);
		process.exit(1);
	}

	console.log("✅ customer JWT create/parse (server + edge)");
}

function verifyCustomerRegister(): void {
	const first = Customer.register({ tenantId: factoryTenantId, name: " Verify Cafe " });
	const second = Customer.register({ tenantId: factoryTenantId, name: "Other", email: " a@b.c " });

	if (first.name !== "Verify Cafe" || first.email !== null) {
		console.error("❌ Customer.register trim name/email");
		process.exit(1);
	}

	if (second.email !== "a@b.c") {
		console.error("❌ Customer.register email trim");
		process.exit(1);
	}

	if (first.qrValue === second.qrValue || first.id === second.id) {
		console.error("❌ Customer.register must generate unique id and qrValue");
		process.exit(1);
	}

	if (first.pointsBalance !== 0 || first.visitsCount !== 0) {
		console.error("❌ Customer.register initial balances");
		process.exit(1);
	}

	console.log("✅ Customer.register factory");
}

async function verifyPrismaSave(): Promise<void> {
	if (!process.env.DATABASE_URL) {
		console.log("✅ verify:customer-session passed (JWT + factory only, no DATABASE_URL)");

		return;
	}

	const tenantRow =
		(await prisma.tenant.findFirst({ where: { id: DEMO_TENANT_ID }, select: { id: true } })) ??
		(await prisma.tenant.findFirst({ select: { id: true } }));

	if (!tenantRow) {
		console.log("✅ verify:customer-session passed (JWT + factory; no tenant row for Prisma)");

		return;
	}

	const tenantId = tenantRow.id;
	const customer = Customer.register({
		tenantId,
		name: `Verify ${Date.now()}`,
	});
	const repo = new PrismaCustomerRepository();

	await repo.save(customer);

	const loaded = await repo.searchById(tenantId, customer.id);
	if (!loaded || loaded.qrValue !== customer.qrValue) {
		console.error("❌ PrismaCustomerRepository.save/searchById");
		process.exit(1);
	}

	await prisma.customer.delete({ where: { id: customer.id } });

	console.log("✅ PrismaCustomerRepository.save customer");
	console.log("✅ verify:customer-session passed");
}

async function main(): Promise<void> {
	await verifyJwtRoundTrip();
	verifyCustomerRegister();
	await verifyPrismaSave();
}

void main();
