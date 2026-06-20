import type { RouletteConfigPrimitives } from "../../contexts/loyalty/games/domain/RouletteConfig";

export const DEMO_ROULETTE_RULES = {
	maxSpinsPerDay: 1,
	maxSpinsPerWeek: 3,
	eligibilityTtlHours: 24,
	trigger: "after_staff_scan" as const,
};

/** Full 6-segment demo config (seed + E2E verifies). */
export const DEMO_ROULETTE_CONFIG: RouletteConfigPrimitives = {
	version: 1,
	segments: [
		{
			id: "00000000-0000-4000-8000-000000000001",
			label: "Sin premio",
			weight: 40,
			prizeType: "none",
			prize: {},
			stockLimit: null,
			stockUsed: 0,
		},
		{
			id: "00000000-0000-4000-8000-000000000002",
			label: "+10 puntos",
			weight: 30,
			prizeType: "points",
			prize: { points: 10 },
			stockLimit: null,
			stockUsed: 0,
		},
		{
			id: "00000000-0000-4000-8000-000000000003",
			label: "+1 sello",
			weight: 15,
			prizeType: "stamp",
			prize: { campaignId: "00000000-0000-4000-8000-000000000010" },
			stockLimit: null,
			stockUsed: 0,
		},
		{
			id: "00000000-0000-4000-8000-000000000004",
			label: "10% descuento",
			weight: 10,
			prizeType: "promotion",
			prize: { promotionId: "00000000-0000-4000-8000-000000000020" },
			stockLimit: null,
			stockUsed: 0,
		},
		{
			id: "00000000-0000-4000-8000-000000000005",
			label: "Café gratis",
			weight: 4,
			prizeType: "physical",
			prize: { description: "Café gratis" },
			stockLimit: 5,
			stockUsed: 0,
		},
		{
			id: "00000000-0000-4000-8000-000000000006",
			label: "+50 puntos",
			weight: 1,
			prizeType: "points",
			prize: { points: 50 },
			stockLimit: null,
			stockUsed: 0,
		},
	],
	rules: DEMO_ROULETTE_RULES,
};
