import { InvalidRouletteConfig } from "./InvalidRouletteConfig";
import { parseRoulettePrizeType, type RoulettePrizeType } from "./RoulettePrizeType";

const MAX_LABEL_LENGTH = 80;
const UUID_PATTERN =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

export type RouletteSegmentPrize = {
	points?: number;
	campaignId?: string;
	promotionId?: string;
	rewardId?: string;
	description?: string;
};

export type RouletteSegmentPrimitives = {
	id: string;
	label: string;
	color?: string;
	weight: number;
	prizeType: RoulettePrizeType;
	prize: RouletteSegmentPrize;
	stockLimit: number | null;
	stockUsed: number;
};

export class RouletteSegment {
	private constructor(private readonly data: RouletteSegmentPrimitives) {}

	static fromPrimitives(primitives: RouletteSegmentPrimitives): RouletteSegment {
		return new RouletteSegment({ ...primitives, prize: { ...primitives.prize } });
	}

	toPrimitives(): RouletteSegmentPrimitives {
		return {
			...this.data,
			prize: { ...this.data.prize },
		};
	}

	isStockExhausted(): boolean {
		if (this.data.stockLimit === null) {
			return false;
		}

		return this.data.stockUsed >= this.data.stockLimit;
	}
}

function parseUuid(value: unknown, field: string): string {
	const id = String(value ?? "").trim();

	if (!id || !UUID_PATTERN.test(id)) {
		throw new InvalidRouletteConfig(`${field} must be a valid UUID`);
	}

	return id;
}

function parseOptionalHexColor(value: unknown): string | undefined {
	if (value === undefined || value === null || value === "") {
		return undefined;
	}

	const color = String(value).trim();

	if (!HEX_COLOR_PATTERN.test(color)) {
		throw new InvalidRouletteConfig("Segment color must be a hex color (#RRGGBB)");
	}

	return color;
}

function parsePositiveInteger(value: unknown, field: string): number {
	const parsed = typeof value === "number" ? value : Number(value);

	if (!Number.isInteger(parsed) || parsed < 1) {
		throw new InvalidRouletteConfig(`${field} must be a positive integer`);
	}

	return parsed;
}

function parseNonNegativeInteger(value: unknown, field: string): number {
	if (value === undefined || value === null) {
		return 0;
	}

	const parsed = typeof value === "number" ? value : Number(value);

	if (!Number.isInteger(parsed) || parsed < 0) {
		throw new InvalidRouletteConfig(`${field} must be a non-negative integer`);
	}

	return parsed;
}

function parseOptionalStockLimit(value: unknown): number | null {
	if (value === undefined || value === null || value === "") {
		return null;
	}

	return parsePositiveInteger(value, "stockLimit");
}

function parsePrizeObject(value: unknown): RouletteSegmentPrize {
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		return {};
	}

	return { ...(value as RouletteSegmentPrize) };
}

function validatePrizePayload(prizeType: RoulettePrizeType, prize: RouletteSegmentPrize): void {
	switch (prizeType) {
		case "points": {
			const points = prize.points;

			if (points === undefined || !Number.isInteger(points) || points < 1) {
				throw new InvalidRouletteConfig("points prize requires prize.points as a positive integer");
			}

			return;
		}
		case "stamp": {
			const campaignId = String(prize.campaignId ?? "").trim();

			if (!campaignId) {
				throw new InvalidRouletteConfig("stamp prize requires prize.campaignId");
			}

			parseUuid(campaignId, "prize.campaignId");

			return;
		}
		case "promotion": {
			const promotionId = String(prize.promotionId ?? "").trim();

			if (!promotionId) {
				throw new InvalidRouletteConfig("promotion prize requires prize.promotionId");
			}

			parseUuid(promotionId, "prize.promotionId");

			return;
		}
		case "physical": {
			const description = String(prize.description ?? "").trim();
			const rewardId = String(prize.rewardId ?? "").trim();

			if (!description && !rewardId) {
				throw new InvalidRouletteConfig(
					"physical prize requires prize.description or prize.rewardId",
				);
			}

			if (rewardId) {
				parseUuid(rewardId, "prize.rewardId");
			}

			return;
		}
		case "none":
			return;
		default:
			throw new InvalidRouletteConfig(`Unsupported prizeType: ${String(prizeType)}`);
	}
}

export function parseRouletteSegment(input: unknown): RouletteSegment {
	if (!input || typeof input !== "object" || Array.isArray(input)) {
		throw new InvalidRouletteConfig("Segment must be an object");
	}

	const record = input as Record<string, unknown>;
	const id = parseUuid(record.id, "segment id");
	const label = String(record.label ?? "").trim();

	if (!label) {
		throw new InvalidRouletteConfig("Segment label is required");
	}

	if (label.length > MAX_LABEL_LENGTH) {
		throw new InvalidRouletteConfig(`Segment label must be at most ${MAX_LABEL_LENGTH} characters`);
	}

	const weight = parsePositiveInteger(record.weight, "weight");
	const prizeType = parseRoulettePrizeType(record.prizeType);
	const prize = parsePrizeObject(record.prize);

	validatePrizePayload(prizeType, prize);

	const stockLimit = parseOptionalStockLimit(record.stockLimit);
	const stockUsed = parseNonNegativeInteger(record.stockUsed, "stockUsed");

	if (stockLimit !== null && stockUsed > stockLimit) {
		throw new InvalidRouletteConfig("stockUsed cannot exceed stockLimit");
	}

	return RouletteSegment.fromPrimitives({
		id,
		label,
		color: parseOptionalHexColor(record.color),
		weight,
		prizeType,
		prize,
		stockLimit,
		stockUsed,
	});
}

export function isSegmentStockExhausted(segment: RouletteSegment): boolean {
	return segment.isStockExhausted();
}
