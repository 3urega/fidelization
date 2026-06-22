import { PlanFeatureNotAvailable } from "../../../billing/subscriptions/domain/PlanFeatureNotAvailable";
import { RouletteGameDisabled } from "../../games/domain/RouletteGameDisabled";
import { RouletteGameNotAvailable } from "../../games/domain/RouletteGameNotAvailable";
import { RouletteMinPurchaseNotMet } from "../../games/domain/RouletteMinPurchaseNotMet";
import { RouletteNotEnrolled } from "../../games/domain/RouletteNotEnrolled";
import { RouletteParticipationPeriodExpired } from "../../games/domain/RouletteParticipationPeriodExpired";
import { RoulettePendingAuthorization } from "../../games/domain/RoulettePendingAuthorization";
import { RouletteQuotaExhausted } from "../../games/domain/RouletteQuotaExhausted";

export type StaffScanOutcomeKind =
	| "point_recorded"
	| "stamp_added"
	| "card_completed"
	| "card_already_completed"
	| "promotion_applied"
	| "promotion_exhausted"
	| "roulette_spin_granted"
	| "roulette_auth_granted"
	| "roulette_auth_denied";

export type RouletteAuthDeniedReasonCode =
	| "not_enrolled"
	| "quota_exhausted"
	| "daily_limit"
	| "min_purchase"
	| "game_disabled"
	| "pending_auth";

export type StaffScanPointRecordedOutcome = {
	kind: "point_recorded";
	pointsBalance: number;
};

export type StaffScanStampAddedOutcome = {
	kind: "stamp_added";
	campaignId: string;
	campaignName: string;
	current: number;
	required: number;
};

export type StaffScanCardCompletedOutcome = {
	kind: "card_completed";
	campaignId: string;
	campaignName: string;
};

export type StaffScanCardAlreadyCompletedOutcome = {
	kind: "card_already_completed";
	campaignId: string;
	campaignName: string;
};

export type StaffScanPromotionAppliedOutcome = {
	kind: "promotion_applied";
	promotionId: string;
	promotionTitle: string;
	usedCount: number;
	maxUsesPerUser: number | null;
};

export type StaffScanPromotionExhaustedOutcome = {
	kind: "promotion_exhausted";
	promotionId: string;
	promotionTitle: string;
	maxUsesPerUser: number | null;
};

export type StaffScanRouletteSpinGrantedOutcome = {
	kind: "roulette_spin_granted";
	expiresAt: string;
};

export type StaffScanRouletteAuthGrantedOutcome = {
	kind: "roulette_auth_granted";
	expiresAt: string;
	purchaseAmountEuros: number;
};

export type StaffScanRouletteAuthDeniedOutcome = {
	kind: "roulette_auth_denied";
	reasonCode: RouletteAuthDeniedReasonCode;
	message: string;
};

export type StaffScanOutcome =
	| StaffScanPointRecordedOutcome
	| StaffScanStampAddedOutcome
	| StaffScanCardCompletedOutcome
	| StaffScanCardAlreadyCompletedOutcome
	| StaffScanPromotionAppliedOutcome
	| StaffScanPromotionExhaustedOutcome
	| StaffScanRouletteSpinGrantedOutcome
	| StaffScanRouletteAuthGrantedOutcome
	| StaffScanRouletteAuthDeniedOutcome;

const STAFF_SCAN_OUTCOME_KINDS = new Set<string>([
	"point_recorded",
	"stamp_added",
	"card_completed",
	"card_already_completed",
	"promotion_applied",
	"promotion_exhausted",
	"roulette_spin_granted",
	"roulette_auth_granted",
	"roulette_auth_denied",
]);

export function isStaffScanOutcome(value: unknown): value is StaffScanOutcome {
	if (!value || typeof value !== "object" || !("kind" in value)) {
		return false;
	}

	const kind = (value as { kind: unknown }).kind;

	return typeof kind === "string" && STAFF_SCAN_OUTCOME_KINDS.has(kind);
}

export function mapRouletteAuthorizeErrorToDeniedOutcome(
	error: unknown,
): StaffScanRouletteAuthDeniedOutcome {
	if (error instanceof RouletteNotEnrolled) {
		return {
			kind: "roulette_auth_denied",
			reasonCode: "not_enrolled",
			message: "El cliente no ha activado la ruleta en la app",
		};
	}

	if (error instanceof RouletteParticipationPeriodExpired) {
		return {
			kind: "roulette_auth_denied",
			reasonCode: "not_enrolled",
			message:
				"El periodo de participación terminó · pide al cliente que reactive la ruleta en la app",
		};
	}

	if (error instanceof RouletteQuotaExhausted) {
		if (error.scope === "daily") {
			return {
				kind: "roulette_auth_denied",
				reasonCode: "daily_limit",
				message: "Ya autorizaste el giro de hoy",
			};
		}

		return {
			kind: "roulette_auth_denied",
			reasonCode: "quota_exhausted",
			message: "Sin giros disponibles en este periodo",
		};
	}

	if (error instanceof RouletteMinPurchaseNotMet) {
		return {
			kind: "roulette_auth_denied",
			reasonCode: "min_purchase",
			message: `Importe ${error.purchaseAmountEuros}€ · mínimo ${error.minPurchaseEuros}€`,
		};
	}

	if (error instanceof RoulettePendingAuthorization) {
		return {
			kind: "roulette_auth_denied",
			reasonCode: "pending_auth",
			message: "Ya tiene un giro pendiente de usar",
		};
	}

	if (
		error instanceof RouletteGameDisabled ||
		error instanceof RouletteGameNotAvailable ||
		error instanceof PlanFeatureNotAvailable
	) {
		return {
			kind: "roulette_auth_denied",
			reasonCode: "game_disabled",
			message: "Ruleta desactivada",
		};
	}

	return {
		kind: "roulette_auth_denied",
		reasonCode: "game_disabled",
		message: "No se pudo autorizar la ruleta",
	};
}

export function formatStaffScanOutcomeMessage(outcome: StaffScanOutcome): string {
	switch (outcome.kind) {
		case "point_recorded":
			return "Punto anotado";
		case "stamp_added":
			return `¡Producto anotado! ${outcome.current} de ${outcome.required} completados`;
		case "card_completed":
			return "¡Has completado la tarjeta!";
		case "card_already_completed":
			return "La tarjeta ya está completada";
		case "promotion_applied":
			return "Promoción aplicada";
		case "promotion_exhausted":
			return "¡La promoción ya ha sido agotada!";
		case "roulette_spin_granted":
			return `Ruleta desbloqueada hasta ${new Date(outcome.expiresAt).toLocaleString("es-ES")}`;
		case "roulette_auth_granted":
			return `Autorizado: puede girar en la app hasta ${new Date(outcome.expiresAt).toLocaleString("es-ES")}`;
		case "roulette_auth_denied":
			return outcome.message;
		default: {
			const exhaustive: never = outcome;

			return exhaustive;
		}
	}
}

export function formatStaffScanOutcomesMessage(outcomes: StaffScanOutcome[]): string {
	return outcomes.map((outcome) => formatStaffScanOutcomeMessage(outcome)).join(" · ");
}
