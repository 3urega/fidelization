import type { RouletteRulesV2 } from "./RouletteConfig";
import type { RouletteParticipation } from "./RouletteParticipation";
import type { RouletteParticipationViewStatus } from "./RouletteParticipation";

export type RouletteParticipationUsage = {
	spinsUsedInPeriod: number;
	spinsRemainingInPeriod: number;
	spinsUsedToday: number;
	spinsRemainingToday: number;
};

export function computeParticipationPeriodEndsAt(
	enrolledAt: Date,
	participationPeriodDays: number,
): Date {
	return new Date(enrolledAt.getTime() + participationPeriodDays * 24 * 60 * 60 * 1000);
}

export function computeParticipationUsage(params: {
	rules: RouletteRulesV2;
	spinsInPeriod: number;
	authorizationsInPeriod: number;
	spinsToday: number;
	authorizationsToday: number;
}): RouletteParticipationUsage {
	const reservedInPeriod = params.spinsInPeriod + params.authorizationsInPeriod;
	const reservedToday = params.spinsToday + params.authorizationsToday;

	return {
		spinsUsedInPeriod: reservedInPeriod,
		spinsRemainingInPeriod: Math.max(0, params.rules.maxSpinsInPeriod - reservedInPeriod),
		spinsUsedToday: reservedToday,
		spinsRemainingToday: Math.max(0, params.rules.maxSpinsPerDay - reservedToday),
	};
}

export function resolveParticipationViewStatus(params: {
	participation: RouletteParticipation | null;
	usage: RouletteParticipationUsage;
	hasPendingAuthorization?: boolean;
	at?: Date;
}): RouletteParticipationViewStatus {
	const at = params.at ?? new Date();

	if (!params.participation) {
		return "not_enrolled";
	}

	if (!params.participation.isPeriodActive(at)) {
		return "period_expired";
	}

	if (params.hasPendingAuthorization) {
		return "active";
	}

	if (params.usage.spinsRemainingInPeriod <= 0 || params.usage.spinsRemainingToday <= 0) {
		return "quota_exhausted";
	}

	return "active";
}

export function eurosToCents(euros: number): number {
	return Math.round(euros * 100);
}

export function meetsMinPurchaseEuros(
	purchaseAmountEuros: number,
	minPurchaseEuros: number | null,
): boolean {
	if (minPurchaseEuros === null || minPurchaseEuros <= 0) {
		return true;
	}

	return eurosToCents(purchaseAmountEuros) >= eurosToCents(minPurchaseEuros);
}
