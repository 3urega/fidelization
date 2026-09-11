import type { StaffScanSessionRouletteParticipation } from "./staffScanSessionTypes";

export function rouletteParticipationStatusLabel(
	participation: StaffScanSessionRouletteParticipation,
): string {
	if (participation.pendingAuthorization) {
		return "Autorización pendiente (cliente puede girar tras tu OK)";
	}

	switch (participation.status) {
		case "not_enrolled":
			return "No inscrito en la ruleta";
		case "quota_exhausted":
			return "Cuota de giros agotada en el periodo";
		case "period_expired":
			return "Periodo de participación expirado";
		case "active":
			return "Participación activa";
		default:
			return participation.status;
	}
}

export function rouletteParticipationDetailLines(
	participation: StaffScanSessionRouletteParticipation,
): string[] {
	const lines: string[] = [];

	if (participation.status === "active" || participation.status === "quota_exhausted") {
		lines.push(
			`Hoy: ${participation.spinsUsedToday} usados · ${participation.spinsRemainingToday} restantes`,
		);
		lines.push(
			`Periodo: ${participation.spinsUsedInPeriod} usados · ${participation.spinsRemainingInPeriod} restantes`,
		);
	}

	if (participation.pendingAuthorization?.expiresAt) {
		const expires = new Date(participation.pendingAuthorization.expiresAt);

		if (!Number.isNaN(expires.getTime())) {
			lines.push(
				`Autorización en curso hasta ${expires.toLocaleString("es-ES", {
					dateStyle: "short",
					timeStyle: "short",
				})}`,
			);
		}
	}

	if (participation.rules.minPurchaseEuros !== null) {
		lines.push(`Compra mínima (reglas): ${participation.rules.minPurchaseEuros}€`);
	}

	return lines;
}
