import {
	migrateV1RulesToV2,
	ROULETTE_CONFIG_VERSION_V2,
	type RouletteConfigPrimitives,
	type RouletteConfigPrimitivesV2,
	type RouletteRulesV2,
} from "../../contexts/loyalty/games/domain/RouletteConfig";

const DEFAULT_V2_SEGMENTS: RouletteConfigPrimitivesV2["segments"] = [
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
];

export const DEFAULT_ROULETTE_RULES_V2: RouletteRulesV2 = {
	participationPeriodDays: 7,
	maxSpinsInPeriod: 3,
	maxSpinsPerDay: 1,
	minPurchaseEuros: 10,
	participationConditionsText: null,
	requiresEnrollment: true,
	authorizationMode: "staff_explicit",
	eligibilityTtlHours: 24,
};

/** Client-safe default when tenant has no saved config yet. Mirrors createDefaultRouletteConfigV2(). */
export const DEFAULT_ROULETTE_CONFIG: RouletteConfigPrimitivesV2 = {
	version: ROULETTE_CONFIG_VERSION_V2,
	segments: DEFAULT_V2_SEGMENTS,
	rules: DEFAULT_ROULETTE_RULES_V2,
};

export function cloneEditorConfig(config: RouletteConfigPrimitivesV2): RouletteConfigPrimitivesV2 {
	return {
		version: config.version,
		rules: { ...config.rules },
		segments: config.segments.map((segment) => ({
			...segment,
			prize: { ...segment.prize },
		})),
	};
}

/** Normalize loaded config to v2 for the owner editor (migrates v1 on load). */
export function normalizeEditorConfig(config: RouletteConfigPrimitives): RouletteConfigPrimitivesV2 {
	if (config.version === ROULETTE_CONFIG_VERSION_V2) {
		return cloneEditorConfig(config);
	}

	const migratedRules = migrateV1RulesToV2(config.rules);

	return {
		version: ROULETTE_CONFIG_VERSION_V2,
		segments: config.segments.map((segment) => ({
			...segment,
			prize: { ...segment.prize },
		})),
		rules: {
			...migratedRules,
			requiresEnrollment: true,
			authorizationMode: "staff_explicit",
			minPurchaseEuros: migratedRules.minPurchaseEuros ?? 10,
			participationConditionsText: migratedRules.participationConditionsText,
			eligibilityTtlHours: 24,
		},
	};
}

export function buildEditorSavePayload(
	config: RouletteConfigPrimitivesV2,
): RouletteConfigPrimitivesV2 {
	return {
		version: ROULETTE_CONFIG_VERSION_V2,
		segments: config.segments.map((segment) => ({
			...segment,
			prize: { ...segment.prize },
		})),
		rules: {
			...config.rules,
			requiresEnrollment: true,
			authorizationMode: "staff_explicit",
			eligibilityTtlHours: 24,
			participationConditionsText:
				config.rules.participationConditionsText?.trim() || null,
		},
	};
}

export type RouletteEditorValidationErrors = {
	participationPeriodDays?: string;
	maxSpinsInPeriod?: string;
	maxSpinsPerDay?: string;
	minPurchaseEuros?: string;
	participationConditionsText?: string;
};

export function validateEditorConfig(
	config: RouletteConfigPrimitivesV2,
): RouletteEditorValidationErrors {
	const errors: RouletteEditorValidationErrors = {};
	const { rules } = config;

	if (!Number.isInteger(rules.participationPeriodDays) || rules.participationPeriodDays < 1) {
		errors.participationPeriodDays = "Debe ser un entero positivo.";
	}

	if (!Number.isInteger(rules.maxSpinsInPeriod) || rules.maxSpinsInPeriod < 1) {
		errors.maxSpinsInPeriod = "Debe ser un entero positivo.";
	}

	if (!Number.isInteger(rules.maxSpinsPerDay) || rules.maxSpinsPerDay < 1) {
		errors.maxSpinsPerDay = "Debe ser un entero positivo.";
	}

	if (
		Number.isInteger(rules.maxSpinsInPeriod) &&
		Number.isInteger(rules.maxSpinsPerDay) &&
		rules.maxSpinsInPeriod < rules.maxSpinsPerDay
	) {
		errors.maxSpinsInPeriod = "Debe ser mayor o igual que los giros por día.";
	}

	if (
		rules.minPurchaseEuros !== null &&
		(!Number.isFinite(rules.minPurchaseEuros) || rules.minPurchaseEuros < 0)
	) {
		errors.minPurchaseEuros = "Debe ser un número ≥ 0 o dejarse vacío.";
	}

	if (
		rules.participationConditionsText !== null &&
		rules.participationConditionsText.length > 500
	) {
		errors.participationConditionsText = "Máximo 500 caracteres.";
	}

	return errors;
}

export function hasEditorValidationErrors(errors: RouletteEditorValidationErrors): boolean {
	return Object.keys(errors).length > 0;
}

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
	segments: RouletteConfigPrimitivesV2["segments"],
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
