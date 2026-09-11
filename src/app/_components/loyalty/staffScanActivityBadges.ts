import type {
	StaffScanSessionData,
	StaffScanSessionPromotion,
	StaffScanSessionStampCard,
} from "./staffScanSessionTypes";

export function stampActivityBadge(stampCards: StaffScanSessionStampCard[]): string {
	if (stampCards.length === 0) {
		return "Sin tarjetas activas";
	}

	const open = stampCards.filter((card) => !card.completed);

	if (open.length === 0) {
		return "Todas completadas";
	}

	const best = open.reduce((acc, card) => {
		const progress = card.required > 0 ? card.current / card.required : 0;

		return progress > acc.ratio ? { card, ratio: progress } : acc;
	}, { card: open[0]!, ratio: 0 });

	return `${best.card.current}/${best.card.required} · ${best.card.campaignName}`;
}

export function promotionsActivityBadge(promotions: StaffScanSessionPromotion[]): {
	badge: string;
	applicableCount: number;
} {
	const applicable = promotions.filter((promotion) => promotion.canApply);

	if (promotions.length === 0) {
		return { badge: "Sin promociones activas", applicableCount: 0 };
	}

	if (applicable.length === 0) {
		const first = promotions[0]!;

		if (first.blockReason === "exhausted") {
			return { badge: "Agotadas", applicableCount: 0 };
		}

		return { badge: "No disponibles", applicableCount: 0 };
	}

	if (applicable.length === 1) {
		const promo = applicable[0]!;
		const max = promo.maxUsesPerUser;

		if (max !== null) {
			return {
				badge: `${promo.usedCount}/${max} usos · ${promo.title}`,
				applicableCount: 1,
			};
		}

		return { badge: promo.title, applicableCount: 1 };
	}

	return {
		badge: `${applicable.length} promociones aplicables`,
		applicableCount: applicable.length,
	};
}

export function rouletteActivityBadge(session: StaffScanSessionData): string {
	const participation = session.roulette?.participation;

	if (!participation) {
		return "No disponible";
	}

	if (participation.pendingAuthorization) {
		return "Autorización pendiente";
	}

	switch (participation.status) {
		case "not_enrolled":
			return "No inscrito en ruleta";
		case "quota_exhausted":
			return "Cuota agotada";
		case "period_expired":
			return "Periodo expirado";
		case "active":
			if (participation.spinsRemainingToday === 0) {
				return "0 tiradas hoy";
			}

			return `${participation.spinsRemainingToday} tirada(s) hoy`;
		default:
			return participation.status;
	}
}

export function redeemActivityBadge(pendingPhysicalCount: number): string {
	if (pendingPhysicalCount === 0) {
		return "Sin premios pendientes";
	}

	if (pendingPhysicalCount === 1) {
		return "1 premio por entregar";
	}

	return `${pendingPhysicalCount} premios por entregar`;
}
