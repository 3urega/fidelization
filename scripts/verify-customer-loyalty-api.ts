/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import {
	TENANT_ID_HEADER,
	TENANT_SLUG_HEADER,
} from "../src/lib/tenant/forwardResolvedTenantHeaders";
import { DEMO_TENANT_ID } from "../src/lib/tenant/mockTenantBySlug";
import { prisma } from "../src/lib/prisma";

/**
 * E2E check: customer register + QR auth + GET /api/loyalty/me on tenant host.
 * Requires dev server. Uses x-tenant-* headers (same as middleware forward).
 */
const baseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000").replace(/\/$/, "");
const tenantSlug = process.env.CUSTOMER_VERIFY_TENANT_SLUG ?? "cafe-demo";
const tenantId = process.env.CUSTOMER_VERIFY_TENANT_ID ?? DEMO_TENANT_ID;

function tenantHeaders(extra: Record<string, string> = {}): Record<string, string> {
	return {
		[TENANT_ID_HEADER]: tenantId,
		[TENANT_SLUG_HEADER]: tenantSlug,
		...extra,
	};
}

async function ensureDemoTenantActive(): Promise<void> {
	if (!process.env.DATABASE_URL) {
		return;
	}

	await prisma.tenant.updateMany({
		where: { id: DEMO_TENANT_ID },
		data: { status: "active" },
	});
}

function parseSetCookieSession(setCookie: string | null): string | null {
	if (!setCookie) {
		return null;
	}

	const match = /session=([^;]+)/.exec(setCookie);

	return match?.[1] ?? null;
}

async function main(): Promise<void> {
	await ensureDemoTenantActive();

	const apexRegister = await fetch(`${baseUrl}/api/loyalty/customers/register`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ name: "Should Fail" }),
	});

	if (apexRegister.status !== 400) {
		console.error("❌ apex register expected 400:", apexRegister.status);
		process.exit(1);
	}

	console.log("✅ apex register → 400 Tenant host required");

	const register = await fetch(`${baseUrl}/api/loyalty/customers/register`, {
		method: "POST",
		headers: tenantHeaders({ "Content-Type": "application/json" }),
		body: JSON.stringify({ name: "Verify Loyalty Customer" }),
	});
	const registerBody = (await register.json()) as {
		customer?: { id: string; qrValue: string; name: string };
		kind?: string;
	};
	const registerCookie = parseSetCookieSession(register.headers.get("set-cookie"));

	if (
		register.status !== 201 ||
		!registerCookie ||
		registerBody.kind !== "customer" ||
		!registerBody.customer?.qrValue
	) {
		console.error("❌ POST register:", register.status, registerBody);
		process.exit(1);
	}

	console.log("✅ POST /api/loyalty/customers/register → 201 + cookie");

	const me = await fetch(`${baseUrl}/api/loyalty/me`, {
		headers: tenantHeaders({ cookie: `session=${registerCookie}` }),
	});
	const meBody = (await me.json()) as {
		customer?: { name: string; qrValue: string; pointsBalance: number };
		kind?: string;
	};

	if (!me.ok || meBody.kind !== "customer" || meBody.customer?.name !== "Verify Loyalty Customer") {
		console.error("❌ GET /api/loyalty/me:", me.status, meBody);
		process.exit(1);
	}

	console.log("✅ GET /api/loyalty/me with customer session");

	const ownerLogin = await fetch(`${baseUrl}/api/auth/demo`, { method: "POST" });
	const ownerCookie = parseSetCookieSession(ownerLogin.headers.get("set-cookie"));
	if (!ownerLogin.ok || !ownerCookie) {
		console.error("❌ owner demo login for isolation check");
		process.exit(1);
	}

	const staffMe = await fetch(`${baseUrl}/api/loyalty/me`, {
		headers: tenantHeaders({ cookie: `session=${ownerCookie}` }),
	});

	if (staffMe.status !== 401) {
		console.error("❌ staff session on /api/loyalty/me expected 401:", staffMe.status);
		process.exit(1);
	}

	console.log("✅ staff session on /api/loyalty/me → 401");

	const qrAuth = await fetch(`${baseUrl}/api/loyalty/auth/qr`, {
		method: "POST",
		headers: tenantHeaders({ "Content-Type": "application/json" }),
		body: JSON.stringify({ qrValue: "demo-qr-cafe-demo" }),
	});
	const qrBody = (await qrAuth.json()) as { customer?: { qrValue: string }; kind?: string };
	const qrCookie = parseSetCookieSession(qrAuth.headers.get("set-cookie"));

	if (!qrAuth.ok || !qrCookie || qrBody.kind !== "customer" || !qrBody.customer?.qrValue) {
		console.error("❌ POST /api/loyalty/auth/qr:", qrAuth.status, qrBody);
		process.exit(1);
	}

	console.log("✅ POST /api/loyalty/auth/qr (seed customer)");

	if (process.env.DATABASE_URL && registerBody.customer?.id) {
		await prisma.customer.deleteMany({ where: { id: registerBody.customer.id } });
	}

	console.log("✅ verify:customer-loyalty-api passed");
}

void main();
