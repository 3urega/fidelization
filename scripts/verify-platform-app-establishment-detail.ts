/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { randomUUID } from "crypto";

import { prisma } from "../src/lib/prisma";

const PLAN_PRO_ID = "00000000-0000-4000-8000-000000000006";

/**
 * E2E: establishment detail discovery/interaction + cross-promos (issue #43).
 * Requires dev server + DATABASE_URL.
 */
const baseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000").replace(/\/$/, "");

function parseSessionCookie(setCookie: string | null): string | null {
	if (!setCookie) {
		return null;
	}

	const match = /session=([^;]+)/.exec(setCookie);

	return match?.[1] ?? null;
}

function sessionHeaders(session: string): { cookie: string } {
	return { cookie: `session=${session}` };
}

type DetailResponse = {
	mode?: string;
	promotions?: { title: string }[];
	customer?: { id: string; pointsBalance: number };
	userQrValue?: string | null;
	stampProgress?: unknown[];
	rewards?: unknown[];
	otherPromotions?: { tenantSlug: string; promotions: { title: string }[] }[];
};

async function registerUser(name: string): Promise<{ email: string; cookie: string }> {
	const email = `verify-est-detail-${randomUUID()}@example.local`;
	const password = "password123";

	const register = await fetch(`${baseUrl}/api/auth/register/user`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ name, email, password }),
	});
	const cookie = parseSessionCookie(register.headers.get("set-cookie"));

	if (register.status !== 201 || !cookie) {
		console.error("❌ register user failed");
		process.exit(1);
	}

	return { email, cookie };
}

async function createBusiness(cookie: string, businessName: string): Promise<string> {
	const create = await fetch(`${baseUrl}/api/user/businesses`, {
		method: "POST",
		headers: { "Content-Type": "application/json", ...sessionHeaders(cookie) },
		body: JSON.stringify({ businessName, businessType: "cafe" }),
	});
	const body = (await create.json()) as { tenant?: { slug: string; id: string } };

	if (create.status !== 201 || !body.tenant?.slug || !body.tenant.id) {
		console.error("❌ create business failed", body);
		process.exit(1);
	}

	await prisma.tenant.update({
		where: { id: body.tenant.id },
		data: { subscriptionPlanId: PLAN_PRO_ID, subscriptionPlan: "pro" },
	});

	return body.tenant.slug;
}

async function assignProAndCreatePromotion(tenantId: string, title: string): Promise<void> {
	await prisma.promotion.create({
		data: {
			tenantId,
			title,
			description: "Verify promo",
			type: "discount",
			isActive: true,
		},
	});
}

async function main(): Promise<void> {
	if (!process.env.DATABASE_URL) {
		console.error("❌ DATABASE_URL required");
		process.exit(1);
	}

	const ownerA = await registerUser("Detail Owner A");
	const slugA = await createBusiness(ownerA.cookie, "Verify Detail Cafe A");
	const tenantA = await prisma.tenant.findUnique({ where: { slug: slugA } });
	if (!tenantA) {
		console.error("❌ tenant A missing");
		process.exit(1);
	}

	await assignProAndCreatePromotion(tenantA.id, "Promo Cafe A");
	console.log(`✅ tenant A ready (${slugA}) with promo`);

	const ownerB = await registerUser("Detail Owner B");
	const slugB = await createBusiness(ownerB.cookie, "Verify Detail Cafe B");
	const tenantB = await prisma.tenant.findUnique({ where: { slug: slugB } });
	if (!tenantB) {
		console.error("❌ tenant B missing");
		process.exit(1);
	}

	await assignProAndCreatePromotion(tenantB.id, "Promo Cafe B");
	console.log(`✅ tenant B ready (${slugB}) with promo`);

	const client = await registerUser("Detail Client");
	console.log("✅ client user ready");

	const discovery = await fetch(`${baseUrl}/api/user/establishments/${slugA}`, {
		headers: sessionHeaders(client.cookie),
	});
	const discoveryBody = (await discovery.json()) as DetailResponse;

	if (!discovery.ok || discoveryBody.mode !== "discovery" || discoveryBody.customer != null) {
		console.error("❌ expected discovery mode", discoveryBody);
		process.exit(1);
	}

	if (discoveryBody.promotions?.length !== 1 || discoveryBody.promotions[0]?.title !== "Promo Cafe A") {
		console.error("❌ discovery promos missing", discoveryBody.promotions);
		process.exit(1);
	}

	console.log("✅ discovery mode with tenant promos");

	const joinA = await fetch(`${baseUrl}/api/user/establishments/join`, {
		method: "POST",
		headers: { "Content-Type": "application/json", ...sessionHeaders(client.cookie) },
		body: JSON.stringify({ slug: slugA }),
	});
	if (joinA.status !== 201) {
		console.error("❌ join A failed", joinA.status);
		process.exit(1);
	}

	const joinB = await fetch(`${baseUrl}/api/user/establishments/join`, {
		method: "POST",
		headers: { "Content-Type": "application/json", ...sessionHeaders(client.cookie) },
		body: JSON.stringify({ slug: slugB }),
	});
	if (joinB.status !== 201) {
		console.error("❌ join B failed", joinB.status);
		process.exit(1);
	}

	console.log("✅ client joined both locales");

	const interaction = await fetch(`${baseUrl}/api/user/establishments/${slugA}`, {
		headers: sessionHeaders(client.cookie),
	});
	const interactionBody = (await interaction.json()) as DetailResponse;

	if (
		!interaction.ok ||
		interactionBody.mode !== "interaction" ||
		!interactionBody.customer ||
		!interactionBody.userQrValue
	) {
		console.error("❌ interaction payload incomplete", interactionBody);
		process.exit(1);
	}

	if (!Array.isArray(interactionBody.stampProgress) || !Array.isArray(interactionBody.rewards)) {
		console.error("❌ interaction missing stampProgress/rewards arrays");
		process.exit(1);
	}

	console.log("✅ interaction mode with user QR");

	const other = interactionBody.otherPromotions ?? [];
	if (
		other.length !== 1 ||
		other[0]?.tenantSlug !== slugB ||
		other[0]?.promotions[0]?.title !== "Promo Cafe B"
	) {
		console.error("❌ otherPromotions missing cross-tenant promo", other);
		process.exit(1);
	}

	console.log("✅ otherPromotions lists linked tenant promo");

	const detailPage = await fetch(`${baseUrl}/u/home/establishments/${slugA}`, {
		headers: sessionHeaders(client.cookie),
	});
	if (detailPage.status !== 200) {
		console.error("❌ detail page:", detailPage.status);
		process.exit(1);
	}

	const qrPage = await fetch(`${baseUrl}/u/home/qr`, { headers: sessionHeaders(client.cookie) });
	const qrHtml = await qrPage.text();
	if (qrPage.status !== 200 || !qrHtml.includes("Tu QR de pago")) {
		console.error("❌ QR page missing");
		process.exit(1);
	}

	console.log("✅ pages /u/home/establishments + /u/home/qr OK");

	const clientRow = await prisma.user.findUnique({
		where: { email: client.email },
		select: { id: true },
	});
	const ownerARow = await prisma.user.findUnique({
		where: { email: ownerA.email },
		select: { id: true, memberships: { select: { tenantId: true } } },
	});
	const ownerBRow = await prisma.user.findUnique({
		where: { email: ownerB.email },
		select: { id: true, memberships: { select: { tenantId: true } } },
	});

	if (!clientRow || !ownerARow || !ownerBRow) {
		console.error("❌ cleanup lookup failed");
		process.exit(1);
	}

	const tenantIds = [
		...ownerARow.memberships.map((row) => row.tenantId),
		...ownerBRow.memberships.map((row) => row.tenantId),
	];
	await prisma.promotion.deleteMany({ where: { tenantId: { in: tenantIds } } });
	await prisma.customer.deleteMany({ where: { userId: clientRow.id } });
	await prisma.tenantMembership.deleteMany({
		where: { userId: { in: [ownerARow.id, ownerBRow.id] } },
	});
	await prisma.tenant.deleteMany({ where: { id: { in: tenantIds } } });
	await prisma.user.deleteMany({
		where: { id: { in: [clientRow.id, ownerARow.id, ownerBRow.id] } },
	});

	console.log("✅ verify:platform-app-establishment-detail passed");
}

void main();
