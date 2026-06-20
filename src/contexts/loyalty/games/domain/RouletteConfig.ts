import { InvalidRouletteConfig } from "./InvalidRouletteConfig";
import { parseRouletteSegment, RouletteSegment, type RouletteSegmentPrimitives } from "./RouletteSegment";

export const ROULETTE_CONFIG_VERSION = 1 as const;
export const MIN_ROULETTE_SEGMENTS = 2;
export const MAX_ROULETTE_SEGMENTS = 8;

export const ROULETTE_TRIGGERS = ["after_staff_scan", "manual"] as const;
export type RouletteTrigger = (typeof ROULETTE_TRIGGERS)[number];

export type RouletteRules = {
	maxSpinsPerDay: number;
	maxSpinsPerWeek: number;
	eligibilityTtlHours: number;
	trigger: RouletteTrigger;
};

export type RouletteConfigPrimitives = {
	version: typeof ROULETTE_CONFIG_VERSION;
	segments: RouletteSegmentPrimitives[];
	rules: RouletteRules;
};

/**
 * Parsed roulette config (v1). Stored as JSON in tenant_game_activations.config (#109).
 */
export class RouletteConfig {
	private constructor(
		public readonly version: typeof ROULETTE_CONFIG_VERSION,
		public readonly segments: RouletteSegment[],
		public readonly rules: RouletteRules,
	) {}

	static fromSegments(segments: RouletteSegment[], rules: RouletteRules): RouletteConfig {
		return new RouletteConfig(ROULETTE_CONFIG_VERSION, segments, rules);
	}

	toPrimitives(): RouletteConfigPrimitives {
		return {
			version: this.version,
			segments: this.segments.map((segment) => segment.toPrimitives()),
			rules: { ...this.rules },
		};
	}

	withIncrementedStockUsed(segmentId: string): RouletteConfig {
		let found = false;

		const segments = this.segments.map((segment) => {
			const primitives = segment.toPrimitives();

			if (primitives.id !== segmentId) {
				return segment;
			}

			found = true;
			const stockUsed = primitives.stockUsed + 1;

			if (primitives.stockLimit !== null && stockUsed > primitives.stockLimit) {
				throw new InvalidRouletteConfig(
					`Segment ${segmentId} stock limit exceeded (${primitives.stockLimit})`,
				);
			}

			return RouletteSegment.fromPrimitives({ ...primitives, stockUsed });
		});

		if (!found) {
			throw new InvalidRouletteConfig(`Segment ${segmentId} not found in config`);
		}

		return RouletteConfig.fromSegments(segments, this.rules);
	}
}

function parseTrigger(value: unknown): RouletteTrigger {
	const trigger = String(value ?? "").trim();

	if (!ROULETTE_TRIGGERS.includes(trigger as RouletteTrigger)) {
		throw new InvalidRouletteConfig(
			`rules.trigger must be one of: ${ROULETTE_TRIGGERS.join(", ")}`,
		);
	}

	return trigger as RouletteTrigger;
}

function parseRules(input: unknown): RouletteRules {
	if (!input || typeof input !== "object" || Array.isArray(input)) {
		throw new InvalidRouletteConfig("rules must be an object");
	}

	const record = input as Record<string, unknown>;
	const maxSpinsPerDay =
		typeof record.maxSpinsPerDay === "number"
			? record.maxSpinsPerDay
			: Number(record.maxSpinsPerDay);
	const maxSpinsPerWeek =
		typeof record.maxSpinsPerWeek === "number"
			? record.maxSpinsPerWeek
			: Number(record.maxSpinsPerWeek);
	const eligibilityTtlHours =
		typeof record.eligibilityTtlHours === "number"
			? record.eligibilityTtlHours
			: Number(record.eligibilityTtlHours);

	if (!Number.isInteger(maxSpinsPerDay) || maxSpinsPerDay < 1) {
		throw new InvalidRouletteConfig("rules.maxSpinsPerDay must be a positive integer");
	}

	if (!Number.isInteger(maxSpinsPerWeek) || maxSpinsPerWeek < 1) {
		throw new InvalidRouletteConfig("rules.maxSpinsPerWeek must be a positive integer");
	}

	if (maxSpinsPerWeek < maxSpinsPerDay) {
		throw new InvalidRouletteConfig("rules.maxSpinsPerWeek must be >= rules.maxSpinsPerDay");
	}

	if (!Number.isInteger(eligibilityTtlHours) || eligibilityTtlHours < 1) {
		throw new InvalidRouletteConfig("rules.eligibilityTtlHours must be a positive integer");
	}

	return {
		maxSpinsPerDay,
		maxSpinsPerWeek,
		eligibilityTtlHours,
		trigger: parseTrigger(record.trigger),
	};
}

function parseSegments(input: unknown): RouletteSegment[] {
	if (!Array.isArray(input)) {
		throw new InvalidRouletteConfig("segments must be an array");
	}

	if (input.length < MIN_ROULETTE_SEGMENTS || input.length > MAX_ROULETTE_SEGMENTS) {
		throw new InvalidRouletteConfig(
			`segments must contain between ${MIN_ROULETTE_SEGMENTS} and ${MAX_ROULETTE_SEGMENTS} items`,
		);
	}

	const segments = input.map((item) => parseRouletteSegment(item));
	const seenIds = new Set<string>();

	for (const segment of segments) {
		const id = segment.toPrimitives().id;

		if (seenIds.has(id)) {
			throw new InvalidRouletteConfig("segment ids must be unique");
		}

		seenIds.add(id);
	}

	return segments;
}

export function parseRouletteConfig(input: unknown): RouletteConfig {
	if (!input || typeof input !== "object" || Array.isArray(input)) {
		throw new InvalidRouletteConfig("Config must be an object");
	}

	const record = input as Record<string, unknown>;
	const version = typeof record.version === "number" ? record.version : Number(record.version);

	if (version !== ROULETTE_CONFIG_VERSION) {
		throw new InvalidRouletteConfig(`Config version must be ${ROULETTE_CONFIG_VERSION}`);
	}

	const segments = parseSegments(record.segments);
	const rules = parseRules(record.rules);

	return RouletteConfig.fromSegments(segments, rules);
}

/** Minimal default config when enabling ruleta without prior upsert. */
export function createDefaultRouletteConfig(): RouletteConfig {
	return parseRouletteConfig({
		version: ROULETTE_CONFIG_VERSION,
		segments: [
			{
				id: "00000000-0000-4000-8000-000000000101",
				label: "Sin premio",
				weight: 50,
				prizeType: "none",
				prize: {},
			},
			{
				id: "00000000-0000-4000-8000-000000000102",
				label: "+10 puntos",
				weight: 30,
				prizeType: "points",
				prize: { points: 10 },
			},
			{
				id: "00000000-0000-4000-8000-000000000103",
				label: "+1 sello",
				weight: 15,
				prizeType: "stamp",
				prize: { campaignId: "00000000-0000-4000-8000-000000000010" },
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
	});
}
