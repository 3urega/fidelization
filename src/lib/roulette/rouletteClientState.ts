import type { RoulettePrizeType } from "../../contexts/loyalty/games/domain/RoulettePrizeType";
import type { RouletteSegmentPrize } from "../../contexts/loyalty/games/domain/RouletteSegment";
import type { RouletteSpinStatus } from "../../contexts/loyalty/games/domain/RouletteSpin";
import type { RouletteParticipationViewStatus } from "../../contexts/loyalty/games/domain/RouletteParticipation";

export type RouletteAuthorizationMode = "staff_explicit" | "after_staff_scan";

export type ClientParticipationStatus =
	| "disabled"
	| "not_enrolled"
	| "active"
	| "authorized_ready"
	| "quota_exhausted"
	| "period_expired";

export type RouletteBlockReason =
	| "not_enrolled"
	| "awaiting_staff_authorization"
	| "quota_exhausted"
	| "period_expired"
	| "disabled"
	| "rate_limit"
	| null;

export type RouletteRecentSpinView = {
	spinId: string;
	createdAt: string;
	segmentLabel: string;
	prizeType: RoulettePrizeType;
	prizeSummary: string;
	status: RouletteSpinStatus;
	redeemedAt: string | null;
};

export function buildConditionsLabel(params: {
	participationConditionsText: string | null;
	minPurchaseEuros: number | null;
}): string | null {
	const custom = params.participationConditionsText?.trim();

	if (custom) {
		return custom;
	}

	if (params.minPurchaseEuros !== null && params.minPurchaseEuros > 0) {
		return `Mín. ${params.minPurchaseEuros}€ en caja`;
	}

	return null;
}

export function resolveClientParticipationStatus(params: {
	isEnabled: boolean;
	domainStatus: RouletteParticipationViewStatus;
	canSpin: boolean;
}): ClientParticipationStatus {
	if (!params.isEnabled) {
		return "disabled";
	}

	switch (params.domainStatus) {
		case "not_enrolled":
			return "not_enrolled";
		case "period_expired":
			return "period_expired";
		case "quota_exhausted":
			return "quota_exhausted";
		case "active":
			return params.canSpin ? "authorized_ready" : "active";
		default:
			return "active";
	}
}

export function resolveBlockReason(params: {
	isEnabled: boolean;
	participationStatus: ClientParticipationStatus;
	canSpin: boolean;
	hasPendingAuthorization: boolean;
}): RouletteBlockReason {
	if (params.canSpin) {
		return null;
	}

	if (!params.isEnabled || params.participationStatus === "disabled") {
		return "disabled";
	}

	switch (params.participationStatus) {
		case "not_enrolled":
			return "not_enrolled";
		case "period_expired":
			return "period_expired";
		case "quota_exhausted":
			return "quota_exhausted";
		case "authorized_ready":
			return null;
		case "active":
			if (params.hasPendingAuthorization) {
				return "rate_limit";
			}

			return "awaiting_staff_authorization";
		default:
			return "disabled";
	}
}

export function formatRouletteSpinPrizeSummary(
	prizeType: RoulettePrizeType,
	prizePayload: RouletteSegmentPrize,
	status: RouletteSpinStatus,
): string {
	switch (prizeType) {
		case "points":
			return `+${String(prizePayload.points ?? 0)} puntos`;
		case "stamp":
			return "Sello extra";
		case "promotion":
			return "Promoción";
		case "physical":
			return status === "pending_redeem" ? "Premio físico (pendiente)" : "Premio físico";
		case "none":
		default:
			return "Sin premio";
	}
}
