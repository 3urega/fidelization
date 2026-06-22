import type {
	ClientParticipationStatus,
	RouletteAuthorizationMode,
	RouletteBlockReason,
	RouletteRecentSpinView,
} from "./rouletteClientState";

export type RoulettePublicStateResponse = {
	isEnabled: boolean;
	canSpin: boolean;
	segments: { id: string; label: string; color?: string }[];
	rules: { maxSpinsPerDay: number; maxSpinsPerWeek: number; eligibilityTtlHours: number };
	eligibility: { expiresAt: string } | null;
	authorizationMode?: RouletteAuthorizationMode;
	participationStatus?: ClientParticipationStatus | null;
	spinsRemainingInPeriod?: number | null;
	spinsUsedInPeriod?: number | null;
	spinsRemainingToday?: number | null;
	spinsUsedToday?: number | null;
	minPurchaseEuros?: number | null;
	conditionsLabel?: string | null;
	periodEndsAt?: string | null;
	enrolledAt?: string | null;
	recentSpins?: RouletteRecentSpinView[];
	blockReason?: RouletteBlockReason;
	error?: { description?: string };
};

export function isStaffExplicitRoulette(state: RoulettePublicStateResponse): boolean {
	return state.authorizationMode === "staff_explicit";
}

export function rouletteStatusMessage(state: RoulettePublicStateResponse): string {
	if (!state.isEnabled) {
		return "La ruleta no está disponible en este local.";
	}

	if (!isStaffExplicitRoulette(state)) {
		if (state.canSpin) {
			return "Tienes un giro disponible. ¡Prueba suerte!";
		}

		if (state.eligibility) {
			return "Has usado tu giro. Vuelve tras una nueva visita.";
		}

		return "Pide en caja que escaneen tu QR para desbloquear la ruleta.";
	}

	switch (state.participationStatus) {
		case "not_enrolled":
			return "Este local tiene ruleta de premios. Actívala para ver cuotas y condiciones.";
		case "active":
			return buildActiveParticipationMessage(state);
		case "authorized_ready":
			return "Tienes un giro autorizado. ¡Prueba suerte!";
		case "quota_exhausted":
			return "Has usado todos tus giros de este periodo.";
		case "period_expired":
			return "Tu periodo de participación terminó. Reactiva la ruleta para seguir jugando.";
		case "disabled":
		default:
			return "La ruleta no está disponible en este local.";
	}
}

function buildActiveParticipationMessage(state: RoulettePublicStateResponse): string {
	const parts: string[] = [];

	if (state.spinsRemainingInPeriod != null) {
		parts.push(
			`Te quedan ${state.spinsRemainingInPeriod} giro${state.spinsRemainingInPeriod === 1 ? "" : "s"} en este periodo`,
		);
	}

	if (state.conditionsLabel) {
		parts.push(state.conditionsLabel);
	}

	if (parts.length === 0) {
		return "Pide en caja que autoricen tu giro de ruleta.";
	}

	return `${parts.join(" · ")}. Pide en caja que autoricen tu giro.`;
}

export function roulettePrimaryCtaLabel(state: RoulettePublicStateResponse): string {
	if (!isStaffExplicitRoulette(state)) {
		if (state.canSpin) {
			return "Girar ruleta";
		}

		if (state.eligibility) {
			return "Ver ruleta";
		}

		return "Cómo desbloquear la ruleta";
	}

	switch (state.participationStatus) {
		case "not_enrolled":
			return "Activar ruleta";
		case "period_expired":
			return "Reactivar ruleta";
		case "authorized_ready":
			return "Girar ruleta";
		case "active":
			return "Ver ruleta";
		case "quota_exhausted":
			return "Ver ruleta";
		default:
			return "Ver ruleta";
	}
}

export function roulettePrimaryAction(
	state: RoulettePublicStateResponse,
): "enroll" | "navigate" | "none" {
	if (!state.isEnabled) {
		return "none";
	}

	if (!isStaffExplicitRoulette(state)) {
		return "navigate";
	}

	if (state.participationStatus === "not_enrolled" || state.participationStatus === "period_expired") {
		return "enroll";
	}

	return "navigate";
}

export function formatSpinHistoryDate(iso: string): string {
	return new Date(iso).toLocaleString("es-ES", {
		day: "numeric",
		month: "short",
		hour: "2-digit",
		minute: "2-digit",
	});
}

export function formatSpinRedeemStatus(status: string): string {
	switch (status) {
		case "pending_redeem":
			return "Pendiente de canje";
		case "applied":
			return "Aplicado";
		case "expired":
			return "Expirado";
		default:
			return status;
	}
}
