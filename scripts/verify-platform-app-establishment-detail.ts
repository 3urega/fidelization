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
	tenant?: { coverImageUrl?: string | null };
	promotions?: {
		id?: string;
		title: string;
		maxUsesPerUser?: number | null;
		usedCount?: number;
	}[];
	customer?: { id: string; pointsBalance: number };
	userQrValue?: string | null;
	stampProgress?: { campaignName: string; current: number; required: number }[];
	rewards?: unknown[];
	otherPromotions?: { tenantSlug: string; promotions: { title: string }[] }[];
};

async function createActiveStampCampaign(tenantId: string, name: string): Promise<string> {
	const campaign = await prisma.stampCampaign.create({
		data: {
			tenantId,
			name,
			requiredStamps: 4,
			isActive: true,
		},
	});

	return campaign.id;
}

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

async function assignProAndCreatePromotion(tenantId: string, title: string): Promise<string> {
	const promotion = await prisma.promotion.create({
		data: {
			tenantId,
			title,
			description: "Verify promo",
			type: "discount",
			isActive: true,
			maxUsesPerUser: 2,
		},
	});

	return promotion.id;
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

	const promoIdA = await assignProAndCreatePromotion(tenantA.id, "Promo Cafe A");
	const campaignIdA = await createActiveStampCampaign(tenantA.id, "Verify Detail Stamp A");
	const campaignIdB = await createActiveStampCampaign(tenantA.id, "Verify Detail Stamp B");
	await prisma.tenant.update({
		where: { id: tenantA.id },
		data: { coverImageUrl: "https://example.com/verify-detail-cover.png" },
	});
	console.log(`✅ tenant A ready (${slugA}) with promo + stamp preview`);

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

	if (
		discoveryBody.promotions?.length !== 1 ||
		discoveryBody.promotions[0]?.title !== "Promo Cafe A" ||
		discoveryBody.promotions[0]?.maxUsesPerUser !== 2 ||
		discoveryBody.promotions[0]?.usedCount !== 0
	) {
		console.error("❌ discovery promos missing", discoveryBody.promotions);
		process.exit(1);
	}

	if (discoveryBody.tenant?.coverImageUrl !== "https://example.com/verify-detail-cover.png") {
		console.error("❌ discovery tenant coverImageUrl missing", discoveryBody.tenant);
		process.exit(1);
	}

	const stampPreview = discoveryBody.stampProgress ?? [];
	const previewA = stampPreview.find((row) => row.campaignName === "Verify Detail Stamp A");
	const previewB = stampPreview.find((row) => row.campaignName === "Verify Detail Stamp B");

	if (
		stampPreview.length !== 2 ||
		!previewA ||
		previewA.current !== 0 ||
		previewA.required !== 4 ||
		!previewB ||
		previewB.current !== 0
	) {
		console.error("❌ discovery stamp preview missing", stampPreview);
		process.exit(1);
	}

	console.log("✅ discovery mode with tenant promos and stamp preview");

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

	const clientRowForProgress = await prisma.user.findUnique({
		where: { email: client.email },
		select: { id: true },
	});

	const customerAfterJoin = await prisma.customer.findFirst({
		where: { tenantId: tenantA.id, userId: clientRowForProgress?.id ?? "" },
		select: { id: true },
	});

	if (!customerAfterJoin) {
		console.error("❌ customer A missing after join");
		process.exit(1);
	}

	await prisma.customerStampProgress.create({
		data: {
			tenantId: tenantA.id,
			customerId: customerAfterJoin.id,
			campaignId: campaignIdA,
			currentStamps: 2,
			completed: false,
		},
	});

	console.log("✅ client progress on one stamp campaign");

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

	const activeRow = interactionBody.stampProgress.find((row) => row.campaignName === "Verify Detail Stamp A");
	const availableRow = interactionBody.stampProgress.find(
		(row) => row.campaignName === "Verify Detail Stamp B",
	);

	if (
		interactionBody.stampProgress.length !== 2 ||
		!activeRow ||
		activeRow.current !== 2 ||
		!availableRow ||
		availableRow.current !== 0
	) {
		console.error("❌ interaction stamp split missing", interactionBody.stampProgress);
		process.exit(1);
	}

	if (
		!interactionBody.promotions ||
		interactionBody.promotions.length < 1 ||
		interactionBody.promotions[0]?.title !== "Promo Cafe A" ||
		interactionBody.promotions[0]?.maxUsesPerUser !== 2 ||
		interactionBody.promotions[0]?.usedCount !== 0
	) {
		console.error("❌ interaction tenant promos missing", interactionBody.promotions);
		process.exit(1);
	}

	console.log("✅ interaction mode with user QR, stamp split and tenant promos");

	const enterOwner = await fetch(`${baseUrl}/api/user/businesses/${slugA}/enter`, {
		method: "POST",
		headers: sessionHeaders(ownerA.cookie),
	});
	const enterOwnerBody = (await enterOwner.json()) as { kind?: string };
	const ownerTenantCookie = parseSessionCookie(enterOwner.headers.get("set-cookie"));

	if (enterOwner.status !== 200 || enterOwnerBody.kind !== "tenant" || !ownerTenantCookie) {
		console.error("❌ owner enter tenant failed", enterOwner.status, enterOwnerBody);
		process.exit(1);
	}

	const recordUse = await fetch(`${baseUrl}/api/loyalty/promotions/${promoIdA}/use`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			...sessionHeaders(ownerTenantCookie),
		},
		body: JSON.stringify({ qrValue: interactionBody.userQrValue }),
	});
	const recordUseBody = (await recordUse.json()) as {
		promotion?: { usedCount?: number; maxUsesPerUser?: number | null };
		error?: { description?: string };
	};

	if (
		recordUse.status !== 200 ||
		recordUseBody.promotion?.usedCount !== 1 ||
		recordUseBody.promotion?.maxUsesPerUser !== 2
	) {
		console.error("❌ POST promotion use failed", recordUse.status, recordUseBody);
		process.exit(1);
	}

	console.log("✅ staff recorded promotion use via QR");

	const afterUse = await fetch(`${baseUrl}/api/user/establishments/${slugA}`, {
		headers: sessionHeaders(client.cookie),
	});
	const afterUseBody = (await afterUse.json()) as DetailResponse;

	if (
		!afterUse.ok ||
		afterUseBody.promotions?.[0]?.usedCount !== 1 ||
		afterUseBody.promotions?.[0]?.maxUsesPerUser !== 2
	) {
		console.error("❌ interaction promos should show usage counter", afterUseBody.promotions);
		process.exit(1);
	}

	console.log("✅ interaction promos show usedCount/maxUsesPerUser after staff use");

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

	const detailPage = await fetch(`${baseUrl}/home/establishments/${slugA}`, {
		headers: sessionHeaders(client.cookie),
	});
	if (detailPage.status !== 200) {
		console.error("❌ detail page:", detailPage.status);
		process.exit(1);
	}

	const qrPage = await fetch(`${baseUrl}/home/qr`, { headers: sessionHeaders(client.cookie) });
	if (qrPage.status !== 200) {
		console.error("❌ QR page:", qrPage.status);
		process.exit(1);
	}

	console.log("✅ pages /home/establishments + /home/qr OK");

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
	await prisma.customerPromotionUsage.deleteMany({ where: { tenantId: { in: tenantIds } } });
	await prisma.promotion.deleteMany({ where: { tenantId: { in: tenantIds } } });
	await prisma.customerStampProgress.deleteMany({ where: { customerId: clientRow.id } });
	await prisma.stampCampaign.deleteMany({ where: { id: { in: [campaignIdA, campaignIdB] } } });
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
