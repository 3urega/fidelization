/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { DEMO_TENANT_ID } from "../src/lib/tenant/mockTenantBySlug";
import { prisma } from "../src/lib/prisma";
import {
	DEMO_CUSTOMER_SEED_ID,
	ensureDemoTenantActive,
	parseSetCookieSession,
	resolveTenantHostHeader,
	tenantFetch,
	tenantSlug,
} from "./lib/customer-verify-helpers";

/**
 * E2E umbrella: tenant host → register customer → cookie → GET /api/loyalty/me → GET /app/card 200.
 * Requires dev server + DATABASE_URL. Uses Host header on loopback (Node http, Windows-safe).
 */
async function assertAppRoutesExist(): Promise<void> {
	const welcome = await tenantFetch("/app/welcome");

	if (welcome.status === 404) {
		console.error(
			"❌ GET /app/welcome → 404. Is `npm run dev` running?",
			`Set NEXT_PUBLIC_API_URL to dev port. Host: ${resolveTenantHostHeader()}`,
		);
		process.exit(1);
	}

	if (welcome.status === 307 || welcome.status === 308) {
		const location = welcome.headers.get("location") ?? "";
		if (location.includes("/app/unavailable")) {
			console.error("❌ GET /app/welcome redirected to unavailable — tenant not resolved from Host");
			process.exit(1);
		}
	}

	console.log("✅ GET /app/welcome reachable on tenant host");
}

async function main(): Promise<void> {
	if (!process.env.DATABASE_URL) {
		console.error("❌ DATABASE_URL required for verify:customer-qr-session");
		process.exit(1);
	}

	await ensureDemoTenantActive();

	console.log(`   tenant host: ${resolveTenantHostHeader()} (Host on 127.0.0.1)`);

	await assertAppRoutesExist();

	const customerName = `Verify QR ${Date.now()}`;

	const register = await tenantFetch("/api/loyalty/customers/register", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ name: customerName }),
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
		!registerBody.customer?.id ||
		!registerBody.customer.qrValue
	) {
		console.error("❌ POST register on tenant host:", register.status, registerBody);
		process.exit(1);
	}

	console.log("✅ POST /api/loyalty/customers/register → 201 + cookie");

	const customerId = registerBody.customer.id;
	const qrValue = registerBody.customer.qrValue;

	const row = await prisma.customer.findUnique({ where: { id: customerId } });

	if (!row || row.tenantId !== DEMO_TENANT_ID || !row.qrValue) {
		console.error("❌ Prisma customer row:", row);
		process.exit(1);
	}

	const qrValueCount = await prisma.customer.count({ where: { qrValue } });

	if (qrValueCount !== 1) {
		console.error("❌ qrValue not unique globally:", qrValue, "count:", qrValueCount);
		process.exit(1);
	}

	console.log("✅ Prisma: customers row with unique qrValue and correct tenant_id");

	const me = await tenantFetch("/api/loyalty/me", {
		headers: { cookie: `session=${registerCookie}` },
	});
	const meBody = (await me.json()) as {
		customer?: { name: string; qrValue: string; pointsBalance: number };
		kind?: string;
	};

	if (
		me.status !== 200 ||
		meBody.kind !== "customer" ||
		meBody.customer?.name !== customerName ||
		meBody.customer.pointsBalance !== 0
	) {
		console.error("❌ GET /api/loyalty/me:", me.status, meBody);
		process.exit(1);
	}

	console.log("✅ GET /api/loyalty/me with customer session");

	const card = await tenantFetch("/app/card", {
		headers: { cookie: `session=${registerCookie}` },
	});

	if (card.status === 307 || card.status === 308) {
		const location = card.headers.get("location") ?? "";
		if (location.includes("/app/welcome")) {
			console.error("❌ GET /app/card redirected to welcome — middleware rejected customer session");
			process.exit(1);
		}
	}

	if (card.status !== 200) {
		console.error("❌ GET /app/card:", card.status);
		process.exit(1);
	}

	const cardHtml = await card.text();
	const hasMarkers =
		cardHtml.includes("puntos") ||
		cardHtml.includes(customerName) ||
		cardHtml.includes("<svg") ||
		cardHtml.includes("Cargando");

	if (!hasMarkers) {
		console.error("❌ GET /app/card body missing expected loyalty card markers");
		process.exit(1);
	}

	console.log("✅ GET /app/card → 200 with customer session");

	const qrAuth = await tenantFetch("/api/loyalty/auth/qr", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ qrValue: "demo-qr-cafe-demo" }),
	});
	const qrBody = (await qrAuth.json()) as { customer?: { qrValue: string }; kind?: string };
	const qrCookie = parseSetCookieSession(qrAuth.headers.get("set-cookie"));

	if (qrAuth.status !== 200 && qrAuth.status !== 201) {
		console.error("❌ POST /api/loyalty/auth/qr (seed):", qrAuth.status, qrBody);
		process.exit(1);
	}

	if (!qrCookie || qrBody.kind !== "customer" || !qrBody.customer?.qrValue) {
		console.error("❌ POST /api/loyalty/auth/qr (seed) body:", qrBody);
		process.exit(1);
	}

	console.log("✅ POST /api/loyalty/auth/qr (seed customer demo-qr-cafe-demo)");

	await prisma.tenant.update({
		where: { id: DEMO_TENANT_ID },
		data: { status: "suspended" },
	});

	const suspendedRegister = await tenantFetch("/api/loyalty/customers/register", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ name: "Should Fail Suspended" }),
	});

	if (suspendedRegister.status !== 403) {
		console.error("❌ suspended tenant register expected 403:", suspendedRegister.status);
		await prisma.tenant.update({
			where: { id: DEMO_TENANT_ID },
			data: { status: "active" },
		});
		process.exit(1);
	}

	await prisma.tenant.update({
		where: { id: DEMO_TENANT_ID },
		data: { status: "active" },
	});

	console.log("✅ suspended tenant blocks customer register → 403");

	await prisma.customer.deleteMany({
		where: { id: customerId },
	});

	const seedStillThere = await prisma.customer.findUnique({ where: { id: DEMO_CUSTOMER_SEED_ID } });

	if (!seedStillThere) {
		console.error("❌ cleanup removed seed customer — expected to keep", DEMO_CUSTOMER_SEED_ID);
		process.exit(1);
	}

	console.log("✅ cleanup: test customer deleted, seed preserved");
	console.log(`✅ verify:customer-qr-session passed (${tenantSlug} on tenant host)`);
}

void main();
