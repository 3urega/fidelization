import { InvalidRouletteConfig } from "./InvalidRouletteConfig";
import { parseRouletteSegment, RouletteSegment, type RouletteSegmentPrimitives } from "./RouletteSegment";

export const ROULETTE_CONFIG_VERSION_V1 = 1 as const;
export const ROULETTE_CONFIG_VERSION_V2 = 2 as const;
/** @deprecated Use ROULETTE_CONFIG_VERSION_V1 */
export const ROULETTE_CONFIG_VERSION = ROULETTE_CONFIG_VERSION_V1;

export type RouletteConfigVersion =
	| typeof ROULETTE_CONFIG_VERSION_V1
	| typeof ROULETTE_CONFIG_VERSION_V2;

export const MIN_ROULETTE_SEGMENTS = 2;
export const MAX_ROULETTE_SEGMENTS = 8;

export const ROULETTE_TRIGGERS = ["after_staff_scan", "manual"] as const;
export type RouletteTrigger = (typeof ROULETTE_TRIGGERS)[number];

export const ROULETTE_AUTHORIZATION_MODES = ["staff_explicit", "after_staff_scan"] as const;
export type RouletteAuthorizationMode = (typeof ROULETTE_AUTHORIZATION_MODES)[number];

export type RouletteRulesV1 = {
	maxSpinsPerDay: number;
	maxSpinsPerWeek: number;
	eligibilityTtlHours: number;
	trigger: RouletteTrigger;
};

export type RouletteRulesV2 = {
	participationPeriodDays: number;
	maxSpinsInPeriod: number;
	maxSpinsPerDay: number;
	minPurchaseEuros: number | null;
	requiresEnrollment: boolean;
	authorizationMode: RouletteAuthorizationMode;
	eligibilityTtlHours: number;
};

export type RouletteRules = RouletteRulesV1 | RouletteRulesV2;

export type RouletteConfigPrimitivesV1 = {
	version: typeof ROULETTE_CONFIG_VERSION_V1;
	segments: RouletteSegmentPrimitives[];
	rules: RouletteRulesV1;
};

export type RouletteConfigPrimitivesV2 = {
	version: typeof ROULETTE_CONFIG_VERSION_V2;
	segments: RouletteSegmentPrimitives[];
	rules: RouletteRulesV2;
};

export type RouletteConfigPrimitives = RouletteConfigPrimitivesV1 | RouletteConfigPrimitivesV2;

export function isRouletteRulesV2(rules: RouletteRules): rules is RouletteRulesV2 {
	return "participationPeriodDays" in rules;
}

export function migrateV1RulesToV2(rules: RouletteRulesV1): RouletteRulesV2 {
	return {
		participationPeriodDays: 7,
		maxSpinsInPeriod: rules.maxSpinsPerWeek,
		maxSpinsPerDay: rules.maxSpinsPerDay,
		minPurchaseEuros: null,
		requiresEnrollment: false,
		authorizationMode: rules.trigger === "after_staff_scan" ? "after_staff_scan" : "staff_explicit",
		eligibilityTtlHours: rules.eligibilityTtlHours,
	};
}

export function getParticipationRules(config: RouletteConfig): RouletteRulesV2 {
	const rules = config.rules;

	if (isRouletteRulesV2(rules)) {
		return rules;
	}

	return migrateV1RulesToV2(rules);
}

export function getRateLimitRules(config: RouletteConfig): {
	maxSpinsPerDay: number;
	maxSpinsPerWeek: number;
	eligibilityTtlHours: number;
} {
	const rules = config.rules;

	if (isRouletteRulesV2(rules)) {
		return {
			maxSpinsPerDay: rules.maxSpinsPerDay,
			maxSpinsPerWeek: rules.maxSpinsInPeriod,
			eligibilityTtlHours: rules.eligibilityTtlHours,
		};
	}

	return {
		maxSpinsPerDay: rules.maxSpinsPerDay,
		maxSpinsPerWeek: rules.maxSpinsPerWeek,
		eligibilityTtlHours: rules.eligibilityTtlHours,
	};
}

export function usesLegacyStaffScanAuthorization(config: RouletteConfig): boolean {
	const rules = config.rules;

	if (isRouletteRulesV2(rules)) {
		return rules.authorizationMode === "after_staff_scan";
	}

	return rules.trigger === "after_staff_scan";
}

export function usesStaffExplicitAuthorization(config: RouletteConfig): boolean {
	return getParticipationRules(config).authorizationMode === "staff_explicit";
}

/**
 * Parsed roulette config (v1 or v2). Stored as JSON in tenant_game_activations.config (#109).
 */
export class RouletteConfig {
	private constructor(
		public readonly version: RouletteConfigVersion,
		public readonly segments: RouletteSegment[],
		public readonly rules: RouletteRules,
	) {}

	static fromSegments(
		version: RouletteConfigVersion,
		segments: RouletteSegment[],
		rules: RouletteRules,
	): RouletteConfig {
		return new RouletteConfig(version, segments, rules);
	}

	toPrimitives(): RouletteConfigPrimitives {
		return {
			version: this.version,
			segments: this.segments.map((segment) => segment.toPrimitives()),
			rules: { ...this.rules },
		} as RouletteConfigPrimitives;
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

		return RouletteConfig.fromSegments(this.version, segments, this.rules);
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

function parseAuthorizationMode(value: unknown): RouletteAuthorizationMode {
	const mode = String(value ?? "").trim();

	if (!ROULETTE_AUTHORIZATION_MODES.includes(mode as RouletteAuthorizationMode)) {
		throw new InvalidRouletteConfig(
			`rules.authorizationMode must be one of: ${ROULETTE_AUTHORIZATION_MODES.join(", ")}`,
		);
	}

	return mode as RouletteAuthorizationMode;
}

function parsePositiveInteger(value: unknown, field: string): number {
	const parsed = typeof value === "number" ? value : Number(value);

	if (!Number.isInteger(parsed) || parsed < 1) {
		throw new InvalidRouletteConfig(`${field} must be a positive integer`);
	}

	return parsed;
}

function parseRulesV1(input: unknown): RouletteRulesV1 {
	if (!input || typeof input !== "object" || Array.isArray(input)) {
		throw new InvalidRouletteConfig("rules must be an object");
	}

	const record = input as Record<string, unknown>;
	const maxSpinsPerDay = parsePositiveInteger(record.maxSpinsPerDay, "rules.maxSpinsPerDay");
	const maxSpinsPerWeek = parsePositiveInteger(record.maxSpinsPerWeek, "rules.maxSpinsPerWeek");
	const eligibilityTtlHours = parsePositiveInteger(
		record.eligibilityTtlHours,
		"rules.eligibilityTtlHours",
	);

	if (maxSpinsPerWeek < maxSpinsPerDay) {
		throw new InvalidRouletteConfig("rules.maxSpinsPerWeek must be >= rules.maxSpinsPerDay");
	}

	return {
		maxSpinsPerDay,
		maxSpinsPerWeek,
		eligibilityTtlHours,
		trigger: parseTrigger(record.trigger),
	};
}

function parseMinPurchaseEuros(value: unknown): number | null {
	if (value === null || value === undefined || value === "") {
		return null;
	}

	const parsed = typeof value === "number" ? value : Number(value);

	if (!Number.isFinite(parsed) || parsed < 0) {
		throw new InvalidRouletteConfig("rules.minPurchaseEuros must be a non-negative number or null");
	}

	return parsed;
}

function parseRulesV2(input: unknown): RouletteRulesV2 {
	if (!input || typeof input !== "object" || Array.isArray(input)) {
		throw new InvalidRouletteConfig("rules must be an object");
	}

	const record = input as Record<string, unknown>;
	const participationPeriodDays = parsePositiveInteger(
		record.participationPeriodDays,
		"rules.participationPeriodDays",
	);
	const maxSpinsInPeriod = parsePositiveInteger(
		record.maxSpinsInPeriod,
		"rules.maxSpinsInPeriod",
	);
	const maxSpinsPerDay = parsePositiveInteger(record.maxSpinsPerDay, "rules.maxSpinsPerDay");
	const eligibilityTtlHours = parsePositiveInteger(
		record.eligibilityTtlHours,
		"rules.eligibilityTtlHours",
	);

	if (maxSpinsInPeriod < maxSpinsPerDay) {
		throw new InvalidRouletteConfig("rules.maxSpinsInPeriod must be >= rules.maxSpinsPerDay");
	}

	const requiresEnrollment = record.requiresEnrollment;

	if (typeof requiresEnrollment !== "boolean") {
		throw new InvalidRouletteConfig("rules.requiresEnrollment must be a boolean");
	}

	return {
		participationPeriodDays,
		maxSpinsInPeriod,
		maxSpinsPerDay,
		minPurchaseEuros: parseMinPurchaseEuros(record.minPurchaseEuros),
		requiresEnrollment,
		authorizationMode: parseAuthorizationMode(record.authorizationMode),
		eligibilityTtlHours,
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
	const segments = parseSegments(record.segments);

	if (version === ROULETTE_CONFIG_VERSION_V1) {
		return RouletteConfig.fromSegments(
			ROULETTE_CONFIG_VERSION_V1,
			segments,
			parseRulesV1(record.rules),
		);
	}

	if (version === ROULETTE_CONFIG_VERSION_V2) {
		return RouletteConfig.fromSegments(
			ROULETTE_CONFIG_VERSION_V2,
			segments,
			parseRulesV2(record.rules),
		);
	}

	throw new InvalidRouletteConfig(
		`Config version must be ${ROULETTE_CONFIG_VERSION_V1} or ${ROULETTE_CONFIG_VERSION_V2}`,
	);
}

/** Minimal default config when enabling ruleta without prior upsert. */
export function createDefaultRouletteConfig(): RouletteConfig {
	return parseRouletteConfig({
		version: ROULETTE_CONFIG_VERSION_V1,
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

/** Default v2 config for participation flow (Phase X). */
export function createDefaultRouletteConfigV2(): RouletteConfig {
	return parseRouletteConfig({
		version: ROULETTE_CONFIG_VERSION_V2,
		segments: createDefaultRouletteConfig().toPrimitives().segments,
		rules: {
			participationPeriodDays: 7,
			maxSpinsInPeriod: 3,
			maxSpinsPerDay: 1,
			minPurchaseEuros: 10,
			requiresEnrollment: true,
			authorizationMode: "staff_explicit",
			eligibilityTtlHours: 24,
		},
	});
}
