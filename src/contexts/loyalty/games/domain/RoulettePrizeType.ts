import { InvalidRouletteConfig } from "./InvalidRouletteConfig";

export const ROULETTE_PRIZE_TYPES = [
	"points",
	"stamp",
	"promotion",
	"physical",
	"none",
] as const;

export type RoulettePrizeType = (typeof ROULETTE_PRIZE_TYPES)[number];

export function parseRoulettePrizeType(value: unknown): RoulettePrizeType {
	const prizeType = String(value ?? "").trim();

	if (!ROULETTE_PRIZE_TYPES.includes(prizeType as RoulettePrizeType)) {
		throw new InvalidRouletteConfig(
			`prizeType must be one of: ${ROULETTE_PRIZE_TYPES.join(", ")}`,
		);
	}

	return prizeType as RoulettePrizeType;
}
