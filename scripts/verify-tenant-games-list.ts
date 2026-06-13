/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { ResolveTenantEffectivePlanFeatures } from "../src/contexts/billing/subscriptions/application/resolve/ResolveTenantEffectivePlanFeatures";
import {
	DEFAULT_SUBSCRIPTION_PLAN_FEATURES,
	type SubscriptionPlanFeatures,
} from "../src/contexts/billing/subscriptions/domain/SubscriptionPlanFeatures";
import { ListAvailablePlatformGamesForTenant } from "../src/contexts/platform/application/games/ListAvailablePlatformGamesForTenant";
import { ListPlatformGames } from "../src/contexts/platform/application/games/ListPlatformGames";
import { PlatformGame } from "../src/contexts/platform/domain/PlatformGame";
import {
	type ListPlatformGamesParams,
	PlatformGameRepository,
} from "../src/contexts/platform/domain/PlatformGameRepository";
import {
	brandingVerifyBaseUrl,
	loginOwnerForBrandingVerify,
} from "./lib/tenant-branding-verify-helpers";
import { ensureDemoTenantActive } from "./lib/customer-verify-helpers";

const PLAN_BASIC_ID = "00000000-0000-4000-8000-000000000004";
const PLAN_PREMIUM_ID = "00000000-0000-4000-8000-000000000007";
const DEMO_GAME_RULETA_ID = "00000000-0000-4000-8000-000000000030";
const DEMO_GAME_RASCA_ID = "00000000-0000-4000-8000-000000000031";

const activeRuleta = PlatformGame.fromPrimitives({
	id: DEMO_GAME_RULETA_ID,
	slug: "ruleta",
	label: "Ruleta",
	description: "",
	status: "active",
	requiredFeature: "gamification",
	sortOrder: 1,
});

const betaRasca = PlatformGame.fromPrimitives({
	id: DEMO_GAME_RASCA_ID,
	slug: "rasca",
	label: "Rasca y gana",
	description: "",
	status: "beta",
	requiredFeature: "gamification",
	sortOrder: 2,
});

const draftCaja = PlatformGame.fromPrimitives({
	id: "game-caja",
	slug: "caja-misteriosa",
	label: "Caja misteriosa",
	description: "",
	status: "draft",
	requiredFeature: "gamification",
	sortOrder: 3,
});

const stampsOnlyGame = PlatformGame.fromPrimitives({
	id: "game-stamps",
	slug: "stamps-only",
	label: "Stamps game",
	description: "",
	status: "active",
	requiredFeature: "stamps",
	sortOrder: 4,
});

class InMemoryPlatformGameRepository extends PlatformGameRepository {
	constructor(private games: PlatformGame[]) {
		super();
	}

	async list(params: ListPlatformGamesParams): Promise<PlatformGame[]> {
		let rows = [...this.games];

		if (params.ownerVisibleOnly) {
			rows = rows.filter((game) => {
				const status = game.toPrimitives().status;
				return status === "active" || status === "beta";
			});
		}

		return rows.sort((left, right) => left.toPrimitives().sortOrder - right.toPrimitives().sortOrder);
	}

	async searchById(id: string): Promise<PlatformGame | null> {
		return this.games.find((game) => game.toPrimitives().id === id) ?? null;
	}

	async searchBySlug(slug: string): Promise<PlatformGame | null> {
		return this.games.find((game) => game.toPrimitives().slug === slug) ?? null;
	}

	async save(game: PlatformGame): Promise<void> {
		const primitives = game.toPrimitives();
		const index = this.games.findIndex((row) => row.toPrimitives().id === primitives.id);

		if (index >= 0) {
			this.games[index] = game;

			return;
		}

		this.games.push(game);
	}

	async maxSortOrder(): Promise<number> {
		return Math.max(...this.games.map((game) => game.toPrimitives().sortOrder), 0);
	}
}

class StubResolveTenantEffectivePlanFeatures extends ResolveTenantEffectivePlanFeatures {
	constructor(private readonly features: SubscriptionPlanFeatures) {
		super({ execute: async () => ({}) } as never);
	}

	async execute(): Promise<{ effectiveFeatures: SubscriptionPlanFeatures }> {
		return { effectiveFeatures: this.features };
	}
}

async function verifyUseCaseStub(): Promise<void> {
	const premiumFeatures: SubscriptionPlanFeatures = {
		...DEFAULT_SUBSCRIPTION_PLAN_FEATURES,
		gamification: true,
	};

	const listGames = new ListPlatformGames(
		new InMemoryPlatformGameRepository([activeRuleta, betaRasca, draftCaja, stampsOnlyGame]),
	);
	const premiumUseCase = new ListAvailablePlatformGamesForTenant(
		listGames,
		new StubResolveTenantEffectivePlanFeatures(premiumFeatures),
	);

	const premiumGames = await premiumUseCase.execute({ tenantId: "tenant-premium" });
	const premiumIds = premiumGames.map((game) => game.toPrimitives().id);

	if (
		premiumIds.length !== 2 ||
		!premiumIds.includes(DEMO_GAME_RULETA_ID) ||
		!premiumIds.includes(DEMO_GAME_RASCA_ID)
	) {
		console.error("❌ premium tenant should see active+beta gamification games", premiumIds);
		process.exit(1);
	}

	const basicFeatures: SubscriptionPlanFeatures = {
		...DEFAULT_SUBSCRIPTION_PLAN_FEATURES,
		gamification: false,
		stamps: true,
	};

	const basicUseCase = new ListAvailablePlatformGamesForTenant(
		listGames,
		new StubResolveTenantEffectivePlanFeatures(basicFeatures),
	);
	const basicGames = await basicUseCase.execute({ tenantId: "tenant-basic" });

	if (basicGames.length !== 0) {
		console.error("❌ basic tenant without gamification should get empty list", basicGames);
		process.exit(1);
	}

	console.log("✅ ListAvailablePlatformGamesForTenant use-case stub");
}

async function verifyE2E(): Promise<void> {
	if (!process.env.DATABASE_URL) {
		console.error("❌ DATABASE_URL required for E2E portion");
		process.exit(1);
	}

	await ensureDemoTenantActive();
	const ownerCookie = await loginOwnerForBrandingVerify();
	const ownerHeaders = {
		cookie: `session=${ownerCookie}`,
		"Content-Type": "application/json",
	};

	const me = await fetch(`${brandingVerifyBaseUrl}/api/me`, {
		headers: { cookie: ownerHeaders.cookie },
	});
	const meBody = (await me.json()) as {
		tenant?: { subscriptionPlanId: string | null };
		role?: string;
	};

	if (!me.ok || meBody.role !== "owner") {
		console.error("❌ GET /api/me owner", me.status, meBody);
		process.exit(1);
	}

	const restorePlanId = meBody.tenant?.subscriptionPlanId ?? PLAN_BASIC_ID;

	await fetch(`${brandingVerifyBaseUrl}/api/billing/tenant-plan`, {
		method: "PATCH",
		headers: ownerHeaders,
		body: JSON.stringify({ planId: PLAN_BASIC_ID }),
	});

	const basicGames = await fetch(`${brandingVerifyBaseUrl}/api/loyalty/games`, {
		headers: { cookie: ownerHeaders.cookie },
	});
	const basicBody = (await basicGames.json()) as { games?: unknown[] };

	if (!basicGames.ok || (basicBody.games?.length ?? 0) !== 0) {
		console.error("❌ Basic tenant GET /api/loyalty/games should be []", basicGames.status, basicBody);
		process.exit(1);
	}

	console.log("✅ Basic tenant GET /api/loyalty/games → []");

	await fetch(`${brandingVerifyBaseUrl}/api/billing/tenant-plan`, {
		method: "PATCH",
		headers: ownerHeaders,
		body: JSON.stringify({ planId: PLAN_PREMIUM_ID }),
	});

	const premiumGames = await fetch(`${brandingVerifyBaseUrl}/api/loyalty/games`, {
		headers: { cookie: ownerHeaders.cookie },
	});
	const premiumBody = (await premiumGames.json()) as {
		games?: { id?: string; slug?: string; status?: string }[];
	};

	if (!premiumGames.ok || !Array.isArray(premiumBody.games)) {
		console.error("❌ Premium GET /api/loyalty/games", premiumGames.status, premiumBody);
		process.exit(1);
	}

	const slugs = premiumBody.games.map((game) => game.slug).sort();
	if (!slugs.includes("ruleta") || !slugs.includes("rasca") || slugs.includes("caja-misteriosa")) {
		console.error("❌ Premium should see ruleta+rasca, not draft caja", slugs);
		process.exit(1);
	}

	console.log("✅ Premium tenant GET /api/loyalty/games → active+beta only");

	const page = await fetch(`${brandingVerifyBaseUrl}/settings/games`, {
		headers: { cookie: ownerHeaders.cookie },
	});

	if (page.status !== 200) {
		console.error("❌ GET /settings/games page", page.status);
		process.exit(1);
	}

	const pageHtml = await page.text();
	if (!pageHtml.includes("Juegos") || !pageHtml.includes("Próximamente")) {
		console.error("❌ settings/games page missing expected copy");
		process.exit(1);
	}

	console.log("✅ GET /settings/games page OK");

	await fetch(`${brandingVerifyBaseUrl}/api/billing/tenant-plan`, {
		method: "PATCH",
		headers: ownerHeaders,
		body: JSON.stringify({ planId: restorePlanId }),
	});
}

async function main(): Promise<void> {
	await verifyUseCaseStub();
	await verifyE2E();
	console.log("✅ verify:tenant-games-list passed");
}

void main();
