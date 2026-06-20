/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { PlanFeatureNotAvailable } from "../src/contexts/billing/subscriptions/domain/PlanFeatureNotAvailable";
import {
	BASIC_PLAN_FEATURES,
	PREMIUM_PLAN_FEATURES,
	type SubscriptionPlanFeatures,
} from "../src/contexts/billing/subscriptions/domain/SubscriptionPlanFeatures";
import { SubscriptionPlan } from "../src/contexts/billing/subscriptions/domain/SubscriptionPlan";
import { EnableTenantGame } from "../src/contexts/loyalty/games/application/config/EnableTenantGame";
import { GetTenantRouletteConfig } from "../src/contexts/loyalty/games/application/config/GetTenantRouletteConfig";
import { UpsertTenantRouletteConfig } from "../src/contexts/loyalty/games/application/config/UpsertTenantRouletteConfig";
import { InvalidRouletteConfig } from "../src/contexts/loyalty/games/domain/InvalidRouletteConfig";
import { createDefaultRouletteConfig } from "../src/contexts/loyalty/games/domain/RouletteConfig";
import {
	RULETA_GAME_SLUG,
	TenantGameActivation,
} from "../src/contexts/loyalty/games/domain/TenantGameActivation";
import { TenantGameActivationRepository } from "../src/contexts/loyalty/games/domain/TenantGameActivationRepository";
import { DEMO_ROULETTE_CONFIG } from "../src/lib/roulette/demoRouletteConfig";

const tenantId = "00000000-0000-4000-8000-0000000000v2";

class InMemoryTenantGameActivationRepository extends TenantGameActivationRepository {
	private rows = new Map<string, TenantGameActivation>();

	private key(tenantIdValue: string, gameSlug: string): string {
		return `${tenantIdValue}:${gameSlug}`;
	}

	async searchByTenantAndSlug(
		tenantIdValue: string,
		gameSlug: string,
	): Promise<TenantGameActivation | null> {
		return this.rows.get(this.key(tenantIdValue, gameSlug)) ?? null;
	}

	async save(activation: TenantGameActivation): Promise<void> {
		const primitives = activation.toPrimitives();
		this.rows.set(this.key(primitives.tenantId, primitives.gameSlug), activation);
	}
}

class StubAssertTenantPlanFeature {
	constructor(private readonly features: SubscriptionPlanFeatures) {}

	async execute(params: { tenantId: string; feature: "gamification" }): Promise<SubscriptionPlan> {
		if (!this.features.gamification) {
			throw new PlanFeatureNotAvailable(params.tenantId, params.feature);
		}

		return SubscriptionPlan.fromPrimitives({
			id: "plan-premium",
			name: "premium",
			priceMonthly: 0,
			priceYearly: 0,
			features: this.features,
			limits: { employees: 50 },
			isActive: true,
		});
	}
}

async function expectPlanBlocked(label: string, action: () => Promise<unknown>): Promise<void> {
	try {
		await action();
		console.error(`❌ ${label}: expected PlanFeatureNotAvailable`);
		process.exit(1);
	} catch (error) {
		if (!(error instanceof PlanFeatureNotAvailable)) {
			console.error(`❌ ${label}: wrong error`, error);
			process.exit(1);
		}
	}

	console.log(`✅ ${label}`);
}

async function main(): Promise<void> {
	const repository = new InMemoryTenantGameActivationRepository();
	const getConfig = new GetTenantRouletteConfig(repository);
	const upsertPremium = new UpsertTenantRouletteConfig(
		repository,
		new StubAssertTenantPlanFeature(PREMIUM_PLAN_FEATURES) as never,
	);
	const enablePremium = new EnableTenantGame(
		repository,
		new StubAssertTenantPlanFeature(PREMIUM_PLAN_FEATURES) as never,
	);
	const upsertBasic = new UpsertTenantRouletteConfig(
		repository,
		new StubAssertTenantPlanFeature(BASIC_PLAN_FEATURES) as never,
	);

	const empty = await getConfig.execute({ tenantId });

	if (empty.isEnabled || empty.config !== null) {
		console.error("❌ missing activation should return disabled null config", empty);
		process.exit(1);
	}

	console.log("✅ GetTenantRouletteConfig empty state");

	const saved = await upsertPremium.execute({
		tenantId,
		config: DEMO_ROULETTE_CONFIG,
	});

	if (saved.config.toPrimitives().segments.length !== 6) {
		console.error("❌ upsert should persist 6 segments", saved);
		process.exit(1);
	}

	const loaded = await getConfig.execute({ tenantId });

	if (!loaded.config || loaded.config.toPrimitives().segments.length !== 6) {
		console.error("❌ get after upsert", loaded);
		process.exit(1);
	}

	console.log("✅ UpsertTenantRouletteConfig round-trip");

	try {
		await upsertPremium.execute({
			tenantId,
			config: { ...DEMO_ROULETTE_CONFIG, segments: [DEMO_ROULETTE_CONFIG.segments[0]] },
		});
		console.error("❌ expected InvalidRouletteConfig on bad config");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof InvalidRouletteConfig)) {
			console.error("❌ wrong error on invalid config", error);
			process.exit(1);
		}
	}

	console.log("✅ UpsertTenantRouletteConfig rejects invalid config");

	await expectPlanBlocked("Basic plan upsert blocked", () =>
		upsertBasic.execute({ tenantId, config: DEMO_ROULETTE_CONFIG }),
	);

	const enabled = await enablePremium.execute({ tenantId: "00000000-0000-4000-8000-0000000000v3", isEnabled: true });

	if (!enabled.isEnabled || enabled.config.toPrimitives().segments.length !== 4) {
		console.error("❌ EnableTenantGame creates default config", enabled);
		process.exit(1);
	}

	console.log("✅ EnableTenantGame creates default when missing");

	const toggled = await enablePremium.execute({ tenantId, isEnabled: true });

	if (!toggled.isEnabled) {
		console.error("❌ EnableTenantGame enables existing row", toggled);
		process.exit(1);
	}

	console.log("✅ EnableTenantGame toggles existing activation");
	console.log(`✅ RULETA_GAME_SLUG=${RULETA_GAME_SLUG}`);
	console.log(`✅ default config segments=${createDefaultRouletteConfig().toPrimitives().segments.length}`);
	console.log("✅ verify:roulette-config-use-case passed");
}

void main();
