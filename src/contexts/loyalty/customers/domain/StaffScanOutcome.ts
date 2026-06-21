export type StaffScanOutcomeKind =
	| "point_recorded"
	| "stamp_added"
	| "card_completed"
	| "card_already_completed"
	| "promotion_applied"
	| "promotion_exhausted"
	| "roulette_spin_granted";

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

export type StaffScanOutcome =
	| StaffScanPointRecordedOutcome
	| StaffScanStampAddedOutcome
	| StaffScanCardCompletedOutcome
	| StaffScanCardAlreadyCompletedOutcome
	| StaffScanPromotionAppliedOutcome
	| StaffScanPromotionExhaustedOutcome
	| StaffScanRouletteSpinGrantedOutcome;

const STAFF_SCAN_OUTCOME_KINDS = new Set<string>([
	"point_recorded",
	"stamp_added",
	"card_completed",
	"card_already_completed",
	"promotion_applied",
	"promotion_exhausted",
	"roulette_spin_granted",
]);

export function isStaffScanOutcome(value: unknown): value is StaffScanOutcome {
	if (!value || typeof value !== "object" || !("kind" in value)) {
		return false;
	}

	const kind = (value as { kind: unknown }).kind;

	return typeof kind === "string" && STAFF_SCAN_OUTCOME_KINDS.has(kind);
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
		default: {
			const exhaustive: never = outcome;

			return exhaustive;
		}
	}
}

export function formatStaffScanOutcomesMessage(outcomes: StaffScanOutcome[]): string {
	return outcomes.map((outcome) => formatStaffScanOutcomeMessage(outcome)).join(" · ");
}
