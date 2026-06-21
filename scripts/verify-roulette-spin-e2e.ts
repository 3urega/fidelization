/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { existsSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";

import { ROULETTE_REQUIRED_ASSET_PATHS } from "../src/app/_components/loyalty/games/rouletteAssets";
import { RULETA_GAME_SLUG } from "../src/contexts/loyalty/games/domain/TenantGameActivation";
import { DEMO_TENANT_ID } from "../src/lib/tenant/mockTenantBySlug";
import { DEMO_ROULETTE_CONFIG } from "../src/lib/roulette/demoRouletteConfig";
import { prisma } from "../src/lib/prisma";
import { ensureDemoTenantActive } from "./lib/customer-verify-helpers";

const baseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000").replace(/\/$/, "");
const PLAN_PREMIUM_ID = "00000000-0000-4000-8000-000000000007";
const tenantSlug = "cafe-demo";

function parseSessionCookie(setCookie: string | null): string | null {
	if (!setCookie) {
		return null;
	}

	const match = /session=([^;]+)/.exec(setCookie);

	return match?.[1] ?? null;
}

function sessionHeaders(session: string): Record<string, string> {
	return { cookie: `session=${session}` };
}

function assertAssetsOnDisk(): void {
	for (const publicPath of ROULETTE_REQUIRED_ASSET_PATHS) {
		const filePath = join(process.cwd(), "public", publicPath.replace(/^\//, ""));

		if (!existsSync(filePath)) {
			console.error("❌ missing asset:", publicPath);
			process.exit(1);
		}

		console.log(`✅ asset ${publicPath}`);
	}
}

async function registerUser(): Promise<string> {
	const email = `verify-roulette-ui-${randomUUID()}@example.local`;
	const password = "password123";

	const register = await fetch(`${baseUrl}/api/auth/register/user`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ name: "Roulette UI User", email, password }),
	});
	const cookie = parseSessionCookie(register.headers.get("set-cookie"));

	if (register.status !== 201 || !cookie) {
		console.error("❌ register user failed", register.status);
		process.exit(1);
	}

	return cookie;
}

async function main(): Promise<void> {
	if (!process.env.DATABASE_URL) {
		console.error("❌ DATABASE_URL required");
		process.exit(1);
	}

	assertAssetsOnDisk();

	await ensureDemoTenantActive();

	const tenant = await prisma.tenant.findFirst({
		where: { id: DEMO_TENANT_ID },
		select: { id: true, subscriptionPlanId: true },
	});

	if (!tenant) {
		console.error("❌ demo tenant not found");
		process.exit(1);
	}

	const restorePlanId = tenant.subscriptionPlanId;

	await prisma.tenant.update({
		where: { id: DEMO_TENANT_ID },
		data: { subscriptionPlanId: PLAN_PREMIUM_ID, subscriptionPlan: "premium" },
	});

	await prisma.tenantGameActivation.upsert({
		where: { tenantId_gameSlug: { tenantId: DEMO_TENANT_ID, gameSlug: RULETA_GAME_SLUG } },
		create: {
			tenantId: DEMO_TENANT_ID,
			gameSlug: RULETA_GAME_SLUG,
			isEnabled: true,
			config: DEMO_ROULETTE_CONFIG,
		},
		update: { isEnabled: true, config: DEMO_ROULETTE_CONFIG },
	});

	const cookie = await registerUser();

	const join = await fetch(`${baseUrl}/api/user/establishments/join`, {
		method: "POST",
		headers: { "Content-Type": "application/json", ...sessionHeaders(cookie) },
		body: JSON.stringify({ slug: tenantSlug }),
	});

	if (join.status !== 200 && join.status !== 201) {
		console.error("❌ join establishment failed", join.status);
		process.exit(1);
	}

	console.log("✅ user joined cafe-demo");

	const page = await fetch(`${baseUrl}/home/establishments/${tenantSlug}/ruleta`, {
		headers: sessionHeaders(cookie),
		redirect: "manual",
	});

	if (page.status !== 200) {
		console.error("❌ GET ruleta page failed", page.status);
		process.exit(1);
	}

	const html = await page.text();

	if (!html.includes("Ruleta")) {
		console.error("❌ ruleta page missing title shell");
		process.exit(1);
	}

	if (
		!html.includes("GIRAR") &&
		!html.includes("Ruleta no disponible") &&
		!html.includes("Girar") &&
		!html.includes("Cargando ruleta")
	) {
		console.error("❌ ruleta page missing spin or locked shell");
		process.exit(1);
	}

	console.log("✅ GET ruleta page HTML smoke");

	const ruletaApi = await fetch(
		`${baseUrl}/api/user/establishments/${tenantSlug}/games/ruleta`,
		{ headers: sessionHeaders(cookie) },
	);
	const ruletaBody = (await ruletaApi.json()) as { isEnabled?: boolean };

	if (!ruletaApi.ok || !ruletaBody.isEnabled) {
		console.error("❌ ruleta API not enabled for cafe-demo", ruletaApi.status, ruletaBody);
		process.exit(1);
	}

	console.log("✅ ruleta API enabled (detail CTA integration)");

	const detailPage = await fetch(`${baseUrl}/home/establishments/${tenantSlug}`, {
		headers: sessionHeaders(cookie),
	});

	if (detailPage.status !== 200) {
		console.error("❌ GET establishment detail page failed", detailPage.status);
		process.exit(1);
	}

	const detailHtml = await detailPage.text();

	if (!detailHtml.includes("Cargando local") && !detailHtml.includes("Mostrar mi QR") && !detailHtml.includes("Ruleta")) {
		console.error("❌ establishment detail page shell unexpected");
		process.exit(1);
	}

	console.log("✅ GET establishment detail page shell");

	await prisma.tenant.update({
		where: { id: DEMO_TENANT_ID },
		data: { subscriptionPlanId: restorePlanId ?? undefined },
	});

	console.log("✅ verify:roulette-spin-e2e passed");
}

void main();
