import type { RouletteConfigPrimitives } from "../../contexts/loyalty/games/domain/RouletteConfig";

/** Client-safe default when tenant has no saved config yet. Mirrors createDefaultRouletteConfig(). */
export const DEFAULT_ROULETTE_CONFIG: RouletteConfigPrimitives = {
	version: 1,
	segments: [
		{
			id: "00000000-0000-4000-8000-000000000101",
			label: "Sin premio",
			weight: 50,
			prizeType: "none",
			prize: {},
			stockLimit: null,
			stockUsed: 0,
		},
		{
			id: "00000000-0000-4000-8000-000000000102",
			label: "+10 puntos",
			weight: 30,
			prizeType: "points",
			prize: { points: 10 },
			stockLimit: null,
			stockUsed: 0,
		},
		{
			id: "00000000-0000-4000-8000-000000000103",
			label: "+1 sello",
			weight: 15,
			prizeType: "stamp",
			prize: { campaignId: "00000000-0000-4000-8000-000000000010" },
			stockLimit: null,
			stockUsed: 0,
		},
		{
			id: "00000000-0000-4000-8000-000000000104",
			label: "Café gratis",
			weight: 5,
			prizeType: "physical",
			prize: { description: "Café gratis" },
			stockLimit: 10,
			stockUsed: 0,
		},
	],
	rules: {
		maxSpinsPerDay: 1,
		maxSpinsPerWeek: 3,
		eligibilityTtlHours: 24,
		trigger: "after_staff_scan",
	},
};

export const ROULETTE_SEGMENT_COLORS = [
	"#6366f1",
	"#8b5cf6",
	"#ec4899",
	"#f97316",
	"#eab308",
	"#22c55e",
	"#14b8a6",
	"#3b82f6",
] as const;

export function segmentDisplayColor(color: string | undefined, index: number): string {
	if (color && /^#[0-9a-fA-F]{6}$/.test(color)) {
		return color;
	}

	return ROULETTE_SEGMENT_COLORS[index % ROULETTE_SEGMENT_COLORS.length] ?? "#6366f1";
}

export function buildConicGradient(
	segments: RouletteConfigPrimitives["segments"],
): string {
	const available = segments.filter(
		(segment) =>
			segment.stockLimit === null || segment.stockUsed < segment.stockLimit,
	);

	if (available.length === 0) {
		return "conic-gradient(#e5e7eb 0deg 360deg)";
	}

	const totalWeight = available.reduce((sum, segment) => sum + segment.weight, 0);

	if (totalWeight <= 0) {
		return "conic-gradient(#e5e7eb 0deg 360deg)";
	}

	let cursor = 0;
	const stops: string[] = [];

	available.forEach((segment, index) => {
		const start = (cursor / totalWeight) * 360;
		cursor += segment.weight;
		const end = (cursor / totalWeight) * 360;
		const color = segmentDisplayColor(segment.color, index);
		stops.push(`${color} ${start}deg ${end}deg`);
	});

	return `conic-gradient(${stops.join(", ")})`;
}

export function formatProbabilityPercent(probability: number): string {
	return `${Math.round(probability * 10_000) / 100}%`;
}
