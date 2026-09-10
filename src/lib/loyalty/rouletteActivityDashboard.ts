import type { GetRouletteActivitySummaryResult } from "../../contexts/loyalty/games/application/activity/GetRouletteActivitySummary";
import type { ListRouletteActivitySpinsResult } from "../../contexts/loyalty/games/application/activity/ListRouletteActivitySpins";

export type RouletteActivityPrizeSummaryJson = {
	segmentId: string;
	label: string;
	spinCount: number;
	distinctCustomers: number;
};

export type RouletteActivitySummaryResponse = {
	date: string;
	timezone: string;
	totalSpins: number;
	prizes: RouletteActivityPrizeSummaryJson[];
	generatedAt: string;
};

export type RouletteActivitySpinRowJson = {
	spinId: string;
	customerId: string;
	customerName: string;
	segmentId: string;
	segmentLabel: string;
	prizeType: string;
	status: string;
	createdAt: string;
	redeemedAt: string | null;
};

export type RouletteActivitySpinsResponse = {
	date: string;
	timezone: string;
	segmentId: string;
	spins: RouletteActivitySpinRowJson[];
};

export function rouletteActivitySummaryToJson(
	result: GetRouletteActivitySummaryResult,
): RouletteActivitySummaryResponse {
	return {
		date: result.date,
		timezone: result.timezone,
		totalSpins: result.totalSpins,
		prizes: result.prizes,
		generatedAt: result.generatedAt.toISOString(),
	};
}

export function rouletteActivitySpinsToJson(
	result: ListRouletteActivitySpinsResult,
): RouletteActivitySpinsResponse {
	return {
		date: result.date,
		timezone: result.timezone,
		segmentId: result.segmentId,
		spins: result.spins.map((row) => ({
			spinId: row.spinId,
			customerId: row.customerId,
			customerName: row.customerName,
			segmentId: row.segmentId,
			segmentLabel: row.segmentLabel,
			prizeType: row.prizeType,
			status: row.status,
			createdAt: row.createdAt.toISOString(),
			redeemedAt: row.redeemedAt?.toISOString() ?? null,
		})),
	};
}
