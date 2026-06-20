/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

process.env.DISABLE_TENANT_PLAN_GATES = "0";

import { AssertTenantPlanFeature } from "../src/contexts/billing/subscriptions/application/guard/AssertTenantPlanFeature";
import { ResolveTenantEffectivePlanFeatures } from "../src/contexts/billing/subscriptions/application/resolve/ResolveTenantEffectivePlanFeatures";
import { ResolveTenantSubscriptionPlan } from "../src/contexts/billing/subscriptions/application/resolve/ResolveTenantSubscriptionPlan";
import { PlanFeatureNotAvailable } from "../src/contexts/billing/subscriptions/domain/PlanFeatureNotAvailable";
import { EnableTenantGame } from "../src/contexts/loyalty/games/application/config/EnableTenantGame";
import { GetTenantRouletteConfig } from "../src/contexts/loyalty/games/application/config/GetTenantRouletteConfig";
import { UpsertTenantRouletteConfig } from "../src/contexts/loyalty/games/application/config/UpsertTenantRouletteConfig";
import { RouletteSpin } from "../src/contexts/loyalty/games/domain/RouletteSpin";
import { RULETA_GAME_SLUG } from "../src/contexts/loyalty/games/domain/TenantGameActivation";
import { PrismaRouletteSpinRepository } from "../src/contexts/loyalty/games/infrastructure/PrismaRouletteSpinRepository";
import { PrismaTenantGameActivationRepository } from "../src/contexts/loyalty/games/infrastructure/PrismaTenantGameActivationRepository";
import { PrismaTenantBillingRepository } from "../src/contexts/billing/subscriptions/infrastructure/PrismaTenantBillingRepository";
import { PrismaTenantRepository } from "../src/contexts/tenants/tenants/infrastructure/PrismaTenantRepository";
import { prisma } from "../src/lib/prisma";
import { DEMO_TENANT_ID } from "../src/lib/tenant/mockTenantBySlug";
import { DEMO_ROULETTE_CONFIG } from "../src/lib/roulette/demoRouletteConfig";

const PLAN_BASIC_ID = "00000000-0000-4000-8000-000000000004";
const PLAN_PREMIUM_ID = "00000000-0000-4000-8000-000000000007";
const DEMO_CUSTOMER_ID = "00000000-0000-4000-8000-000000000005";

async function main(): Promise<void> {
	if (!process.env.DATABASE_URL) {
		console.error("❌ DATABASE_URL required");
		process.exit(1);
	}

	const tenant = await prisma.tenant.findFirst({
		where: { id: DEMO_TENANT_ID },
		select: { id: true, subscriptionPlanId: true },
	});

	if (!tenant) {
		console.error("❌ demo tenant not found — run seed");
		process.exit(1);
	}

	const restorePlanId = tenant.subscriptionPlanId ?? PLAN_BASIC_ID;

	const activationRepository = new PrismaTenantGameActivationRepository();
	const spinRepository = new PrismaRouletteSpinRepository();
	const assertFeature = new AssertTenantPlanFeature(
		new ResolveTenantEffectivePlanFeatures(
			new ResolveTenantSubscriptionPlan(
				new PrismaTenantRepository(),
				new PrismaTenantBillingRepository(),
			),
			new PrismaTenantRepository(),
		),
	);
	const getConfig = new GetTenantRouletteConfig(activationRepository);
	const upsertConfig = new UpsertTenantRouletteConfig(activationRepository, assertFeature);
	const enableGame = new EnableTenantGame(activationRepository, assertFeature);

	await prisma.tenant.update({
		where: { id: DEMO_TENANT_ID },
		data: { subscriptionPlanId: PLAN_BASIC_ID, subscriptionPlan: "basic" },
	});

	try {
		await upsertConfig.execute({ tenantId: DEMO_TENANT_ID, config: DEMO_ROULETTE_CONFIG });
		console.error("❌ Basic tenant upsert should throw PlanFeatureNotAvailable");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof PlanFeatureNotAvailable)) {
			console.error("❌ wrong error on basic upsert", error);
			process.exit(1);
		}
	}

	console.log("✅ Basic plan upsert blocked");

	await prisma.tenant.update({
		where: { id: DEMO_TENANT_ID },
		data: { subscriptionPlanId: PLAN_PREMIUM_ID, subscriptionPlan: "premium" },
	});

	const saved = await upsertConfig.execute({
		tenantId: DEMO_TENANT_ID,
		config: DEMO_ROULETTE_CONFIG,
	});

	if (saved.config.toPrimitives().segments.length !== 6) {
		console.error("❌ premium upsert segments", saved);
		process.exit(1);
	}

	const row = await prisma.tenantGameActivation.findUnique({
		where: {
			tenantId_gameSlug: {
				tenantId: DEMO_TENANT_ID,
				gameSlug: RULETA_GAME_SLUG,
			},
		},
	});

	if (!row || typeof row.config !== "object") {
		console.error("❌ prisma row missing after upsert", row);
		process.exit(1);
	}

	console.log("✅ premium upsert persisted in tenant_game_activations");

	const loaded = await getConfig.execute({ tenantId: DEMO_TENANT_ID });

	if (!loaded.config || loaded.config.toPrimitives().segments.length !== 6) {
		console.error("❌ get config after upsert", loaded);
		process.exit(1);
	}

	console.log("✅ GetTenantRouletteConfig reads persisted config");

	const enabled = await enableGame.execute({ tenantId: DEMO_TENANT_ID, isEnabled: true });

	if (!enabled.isEnabled) {
		console.error("❌ enable game", enabled);
		process.exit(1);
	}

	console.log("✅ EnableTenantGame on premium tenant");

	const spin = RouletteSpin.create({
		tenantId: DEMO_TENANT_ID,
		customerId: DEMO_CUSTOMER_ID,
		segmentId: DEMO_ROULETTE_CONFIG.segments[1]?.id ?? "",
		segmentIndex: 1,
		prizeType: "points",
		prizePayload: { points: 10 },
		triggerSource: "manual",
		configSnapshot: DEMO_ROULETTE_CONFIG,
	});

	await spinRepository.save(spin);

	const reloaded = await spinRepository.searchById(DEMO_TENANT_ID, spin.toPrimitives().id);

	if (!reloaded || reloaded.toPrimitives().prizeType !== "points") {
		console.error("❌ roulette spin save/search", reloaded);
		process.exit(1);
	}

	const count = await spinRepository.countByCustomerSince(
		DEMO_TENANT_ID,
		DEMO_CUSTOMER_ID,
		new Date(Date.now() - 60_000),
	);

	if (count < 1) {
		console.error("❌ countByCustomerSince", count);
		process.exit(1);
	}

	console.log("✅ PrismaRouletteSpinRepository save/search/count");

	await prisma.rouletteSpin.deleteMany({ where: { tenantId: DEMO_TENANT_ID, id: spin.toPrimitives().id } });

	await prisma.tenant.update({
		where: { id: DEMO_TENANT_ID },
		data: {
			subscriptionPlanId: restorePlanId,
			subscriptionPlan: restorePlanId === PLAN_PREMIUM_ID ? "premium" : "basic",
		},
	});

	console.log("✅ verify:roulette-config passed");
}

void main();
