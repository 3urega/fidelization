/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

process.env.DISABLE_TENANT_PLAN_GATES = "0";

import { AssertTenantPlanFeature } from "../src/contexts/billing/subscriptions/application/guard/AssertTenantPlanFeature";
import { ResolveTenantEffectivePlanFeatures } from "../src/contexts/billing/subscriptions/application/resolve/ResolveTenantEffectivePlanFeatures";
import { ResolveTenantSubscriptionPlan } from "../src/contexts/billing/subscriptions/application/resolve/ResolveTenantSubscriptionPlan";
import { PlanFeatureNotAvailable } from "../src/contexts/billing/subscriptions/domain/PlanFeatureNotAvailable";
import { UpsertTenantRouletteConfig } from "../src/contexts/loyalty/games/application/config/UpsertTenantRouletteConfig";
import { RULETA_GAME_SLUG } from "../src/contexts/loyalty/games/domain/TenantGameActivation";
import { PrismaTenantGameActivationRepository } from "../src/contexts/loyalty/games/infrastructure/PrismaTenantGameActivationRepository";
import { PrismaTenantBillingRepository } from "../src/contexts/billing/subscriptions/infrastructure/PrismaTenantBillingRepository";
import { PrismaTenantRepository } from "../src/contexts/tenants/tenants/infrastructure/PrismaTenantRepository";
import { DEMO_TENANT_ID } from "../src/lib/tenant/mockTenantBySlug";
import { DEMO_ROULETTE_CONFIG } from "../src/lib/roulette/demoRouletteConfig";
import { prisma } from "../src/lib/prisma";
import {
	apexBaseUrl,
	ensureDemoTenantActive,
	parseSetCookieSession,
	tenantFetch,
} from "./lib/customer-verify-helpers";
import {
	brandingVerifyBaseUrl,
	loginOwnerForBrandingVerify,
} from "./lib/tenant-branding-verify-helpers";

const PLAN_BASIC_ID = "00000000-0000-4000-8000-000000000004";
const PLAN_PREMIUM_ID = "00000000-0000-4000-8000-000000000007";

/**
 * E2E: owner GET/PUT ruleta config + PATCH activation; employee 403; Basic plan gate on PUT.
 * Requires dev server + DATABASE_URL.
 */
async function main(): Promise<void> {
	if (!process.env.DATABASE_URL) {
		console.error("❌ DATABASE_URL required");
		process.exit(1);
	}

	await ensureDemoTenantActive();

	const tenant = await prisma.tenant.findFirst({
		where: { id: DEMO_TENANT_ID },
		select: { id: true, subscriptionPlanId: true },
	});

	if (!tenant) {
		console.error("❌ demo tenant not found — run seed");
		process.exit(1);
	}

	const restorePlanId = tenant.subscriptionPlanId ?? PLAN_BASIC_ID;
	const ownerCookie = await loginOwnerForBrandingVerify();
	const ownerHeaders = {
		cookie: `session=${ownerCookie}`,
		"Content-Type": "application/json",
	};

	const me = await fetch(`${brandingVerifyBaseUrl}/api/me`, {
		headers: { cookie: ownerHeaders.cookie },
	});
	const meBody = (await me.json()) as { role?: string; tenant?: { id: string } };

	if (!me.ok || meBody.role !== "owner" || meBody.tenant?.id !== DEMO_TENANT_ID) {
		console.error("❌ GET /api/me owner:", me.status, meBody);
		process.exit(1);
	}

	console.log("✅ GET /api/me (owner)");

	await fetch(`${brandingVerifyBaseUrl}/api/billing/tenant-plan`, {
		method: "PATCH",
		headers: ownerHeaders,
		body: JSON.stringify({ planId: PLAN_PREMIUM_ID }),
	});

	const getConfig = await fetch(`${brandingVerifyBaseUrl}/api/loyalty/games/ruleta/config`, {
		headers: { cookie: ownerHeaders.cookie },
	});
	const getBody = (await getConfig.json()) as {
		isEnabled?: boolean;
		config?: { segments?: { weight: number }[] };
		error?: { type?: string };
	};

	if (!getConfig.ok || !getBody.config?.segments?.length) {
		console.error("❌ GET ruleta config:", getConfig.status, getBody);
		process.exit(1);
	}

	console.log("✅ GET /api/loyalty/games/ruleta/config");

	const invalidPut = await fetch(`${brandingVerifyBaseUrl}/api/loyalty/games/ruleta/config`, {
		method: "PUT",
		headers: ownerHeaders,
		body: JSON.stringify({ config: { version: 1, segments: [], rules: {} } }),
	});
	const invalidBody = (await invalidPut.json()) as { error?: { type?: string } };

	if (invalidPut.status !== 400 || invalidBody.error?.type !== "InvalidRouletteConfig") {
		console.error("❌ PUT invalid config:", invalidPut.status, invalidBody);
		process.exit(1);
	}

	console.log("✅ PUT invalid config → 400 InvalidRouletteConfig");

	const nextConfig = {
		...DEMO_ROULETTE_CONFIG,
		segments: DEMO_ROULETTE_CONFIG.segments.map((segment, index) =>
			index === 0 ? { ...segment, weight: segment.weight + 1 } : segment,
		),
		rules: {
			...DEMO_ROULETTE_CONFIG.rules,
			participationConditionsText: "Consumición en barra",
		},
	};

	const putConfig = await fetch(`${brandingVerifyBaseUrl}/api/loyalty/games/ruleta/config`, {
		method: "PUT",
		headers: ownerHeaders,
		body: JSON.stringify({ config: nextConfig }),
	});
	const putBody = (await putConfig.json()) as {
		config?: {
			version?: number;
			segments?: { weight: number }[];
			rules?: {
				participationPeriodDays?: number;
				maxSpinsInPeriod?: number;
				participationConditionsText?: string | null;
			};
		};
		error?: { type?: string };
	};

	if (
		!putConfig.ok ||
		putBody.config?.version !== 2 ||
		putBody.config?.segments?.[0]?.weight !== nextConfig.segments[0]?.weight ||
		putBody.config?.rules?.participationPeriodDays !== 7 ||
		putBody.config?.rules?.maxSpinsInPeriod !== 3 ||
		putBody.config?.rules?.participationConditionsText !== "Consumición en barra"
	) {
		console.error("❌ PUT ruleta config v2:", putConfig.status, putBody);
		process.exit(1);
	}

	const prismaRow = await prisma.tenantGameActivation.findUnique({
		where: {
			tenantId_gameSlug: { tenantId: DEMO_TENANT_ID, gameSlug: RULETA_GAME_SLUG },
		},
	});

	const prismaConfig = prismaRow?.config as {
		version?: number;
		rules?: { participationPeriodDays?: number };
	} | null;

	if (!prismaConfig || prismaConfig.version !== 2 || prismaConfig.rules?.participationPeriodDays !== 7) {
		console.error("❌ Prisma config should persist v2:", prismaConfig);
		process.exit(1);
	}

	console.log("✅ PUT /api/loyalty/games/ruleta/config (v2)");

	const patchOff = await fetch(`${brandingVerifyBaseUrl}/api/loyalty/games/ruleta/activation`, {
		method: "PATCH",
		headers: ownerHeaders,
		body: JSON.stringify({ isEnabled: false }),
	});
	const patchOffBody = (await patchOff.json()) as {
		isEnabled?: boolean;
		error?: { type?: string };
	};

	if (!patchOff.ok || patchOffBody.isEnabled !== false) {
		console.error("❌ PATCH deactivate:", patchOff.status, patchOffBody);
		process.exit(1);
	}

	const row = await prisma.tenantGameActivation.findUnique({
		where: {
			tenantId_gameSlug: { tenantId: DEMO_TENANT_ID, gameSlug: RULETA_GAME_SLUG },
		},
	});

	if (!row || row.isEnabled) {
		console.error("❌ Prisma activation should be disabled:", row);
		process.exit(1);
	}

	console.log("✅ PATCH activation → isEnabled false + Prisma");

	const patchOn = await fetch(`${brandingVerifyBaseUrl}/api/loyalty/games/ruleta/activation`, {
		method: "PATCH",
		headers: ownerHeaders,
		body: JSON.stringify({ isEnabled: true }),
	});
	const patchOnBody = (await patchOn.json()) as { isEnabled?: boolean };

	if (!patchOn.ok || patchOnBody.isEnabled !== true) {
		console.error("❌ PATCH activate:", patchOn.status, patchOnBody);
		process.exit(1);
	}

	console.log("✅ PATCH activation → isEnabled true");

	const employeeEmail = `roulette.employee.${Date.now()}@example.com`;
	const employeePassword = "temp-pass-roulette-verify";

	const invite = await fetch(`${apexBaseUrl}/api/tenant/employees`, {
		method: "POST",
		headers: ownerHeaders,
		body: JSON.stringify({
			name: "Roulette Verify Employee",
			email: employeeEmail,
			password: employeePassword,
		}),
	});

	if (invite.status !== 201) {
		console.error("❌ invite employee:", invite.status, await invite.json());
		process.exit(1);
	}

	const employeeLogin = await tenantFetch("/api/auth/login", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ email: employeeEmail, password: employeePassword }),
	});
	const employeeCookie = parseSetCookieSession(employeeLogin.headers.get("set-cookie") ?? null);

	if (employeeLogin.status !== 200 || !employeeCookie) {
		console.error("❌ employee login:", employeeLogin.status, await employeeLogin.json());
		process.exit(1);
	}

	const employeeSession = `session=${employeeCookie}`;

	const employeeGet = await tenantFetch("/api/loyalty/games/ruleta/config", {
		headers: { cookie: employeeSession },
	});
	const employeeGetBody = (await employeeGet.json()) as { error?: { type?: string } };

	if (employeeGet.status !== 403 || employeeGetBody.error?.type !== "RouletteConfigForbidden") {
		console.error("❌ employee GET config:", employeeGet.status, employeeGetBody);
		process.exit(1);
	}

	console.log("✅ employee GET config → 403 RouletteConfigForbidden");

	const employeePut = await tenantFetch("/api/loyalty/games/ruleta/config", {
		method: "PUT",
		headers: { "Content-Type": "application/json", cookie: employeeSession },
		body: JSON.stringify({ config: DEMO_ROULETTE_CONFIG }),
	});
	const employeePutBody = (await employeePut.json()) as { error?: { type?: string } };

	if (employeePut.status !== 403 || employeePutBody.error?.type !== "RouletteConfigForbidden") {
		console.error("❌ employee PUT config:", employeePut.status, employeePutBody);
		process.exit(1);
	}

	console.log("✅ employee PUT config → 403 RouletteConfigForbidden");

	await prisma.tenant.update({
		where: { id: DEMO_TENANT_ID },
		data: { subscriptionPlanId: PLAN_BASIC_ID, subscriptionPlan: "basic" },
	});

	const activationRepository = new PrismaTenantGameActivationRepository();
	const assertFeature = new AssertTenantPlanFeature(
		new ResolveTenantEffectivePlanFeatures(
			new ResolveTenantSubscriptionPlan(
				new PrismaTenantRepository(),
				new PrismaTenantBillingRepository(),
			),
			new PrismaTenantRepository(),
		),
	);
	const upsertConfig = new UpsertTenantRouletteConfig(activationRepository, assertFeature);

	try {
		await upsertConfig.execute({ tenantId: DEMO_TENANT_ID, config: DEMO_ROULETTE_CONFIG });
		console.error("❌ Basic plan upsert should throw PlanFeatureNotAvailable");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof PlanFeatureNotAvailable)) {
			console.error("❌ wrong error on basic upsert", error);
			process.exit(1);
		}
	}

	console.log("✅ Basic plan upsert blocked (use case)");

	await prisma.tenant.update({
		where: { id: DEMO_TENANT_ID },
		data: { subscriptionPlanId: PLAN_PREMIUM_ID, subscriptionPlan: "premium" },
	});

	const ruletaPage = await fetch(`${brandingVerifyBaseUrl}/settings/games/ruleta`, {
		headers: { cookie: ownerHeaders.cookie },
	});

	if (ruletaPage.status !== 200) {
		console.error("❌ GET /settings/games/ruleta page:", ruletaPage.status);
		process.exit(1);
	}

	const pageHtml = await ruletaPage.text();
	if (!pageHtml.includes("Ruleta") || !pageHtml.includes("cuotas de participación")) {
		console.error("❌ settings/games/ruleta page missing v2 participation copy");
		process.exit(1);
	}

	console.log("✅ GET /settings/games/ruleta page OK");

	await prisma.tenant.update({
		where: { id: DEMO_TENANT_ID },
		data: { subscriptionPlanId: restorePlanId },
	});

	await fetch(`${brandingVerifyBaseUrl}/api/billing/tenant-plan`, {
		method: "PATCH",
		headers: ownerHeaders,
		body: JSON.stringify({ planId: restorePlanId }),
	});

	console.log("✅ verify:roulette-owner-config passed");
}

void main();
