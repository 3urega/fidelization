export type CustomerEngagementStatus = "vip" | "active" | "at_risk" | "inactive";

export type CustomerZoneNearReward = {
	campaignId: string;
	campaignName: string;
	current: number;
	required: number;
};

export type CustomerZoneListCustomer = {
	id: string;
	name: string;
	lastVisitAt: string | null;
	visitsThisMonth: number;
	visitsCount: number;
	totalStamps: number;
	rewardsRedeemedCount: number;
	status: CustomerEngagementStatus;
	nearReward?: CustomerZoneNearReward;
};

export type CustomerZoneInsightsResponse = {
	vipCount?: number;
	atRiskCount?: number;
	nearRewardCount?: number;
	newThisMonthCount?: number;
	generatedAt?: string;
	timezone?: string;
	error?: {
		description?: string;
		type?: string;
	};
};

export type CustomerZoneListResponse = {
	segment?: string;
	customers?: CustomerZoneListCustomer[];
	generatedAt?: string;
	timezone?: string;
	error?: {
		description?: string;
		type?: string;
	};
};

export type CustomerZoneSegment = "featured" | "at_risk" | "near_reward" | "all";

export type CustomerZoneDetailStampProgress = {
	campaignId: string;
	campaignName: string;
	current: number;
	required: number;
	completed: boolean;
	stampTypeLabel: string;
};

export type CustomerZoneDetailActivity = {
	occurredAt: string;
	label: string;
};

export type CustomerZoneDetailReward = {
	rewardName: string;
	redeemedAt: string;
};

export type CustomerZoneDetailPromotion = {
	id: string;
	title: string;
	type: "discount" | "bundle" | "seasonal";
	isActive: boolean;
	usedCount: number;
	maxUsesPerUser: number | null;
};

export type CustomerZoneDetailRouletteSpin = {
	id: string;
	segmentLabel: string;
	prizeType: "none" | "points" | "physical";
	status: "pending_redeem" | "applied" | "expired";
	createdAt: string;
	redeemedAt: string | null;
};

export type CustomerZoneDetailResponse = {
	id?: string;
	name?: string;
	email?: string;
	phone?: string;
	customerSince?: string;
	visitsCount?: number;
	pointsBalance?: number;
	status?: CustomerEngagementStatus;
	stampProgress?: CustomerZoneDetailStampProgress[];
	recentActivity?: CustomerZoneDetailActivity[];
	rewardsRedeemed?: CustomerZoneDetailReward[];
	promotions?: CustomerZoneDetailPromotion[];
	rouletteSpins?: CustomerZoneDetailRouletteSpin[];
	error?: {
		description?: string;
		type?: string;
	};
};

function capitalizeFirst(value: string): string {
	if (!value) {
		return value;
	}

	return value.charAt(0).toUpperCase() + value.slice(1);
}

export function formatCustomerSince(iso: string | undefined): string {
	if (!iso) {
		return "—";
	}

	const date = new Date(iso);

	if (Number.isNaN(date.getTime())) {
		return "—";
	}

	return capitalizeFirst(
		date.toLocaleDateString("es-ES", {
			month: "long",
			year: "numeric",
		}),
	);
}

export function formatActivityDate(iso: string): string {
	const date = new Date(iso);

	if (Number.isNaN(date.getTime())) {
		return iso;
	}

	return date
		.toLocaleDateString("es-ES", {
			day: "2-digit",
			month: "short",
		})
		.replace(".", "");
}

export function formatRewardRedeemedDate(iso: string): string {
	const date = new Date(iso);

	if (Number.isNaN(date.getTime())) {
		return iso;
	}

	return capitalizeFirst(
		date.toLocaleDateString("es-ES", {
			day: "numeric",
			month: "long",
		}),
	);
}

function startOfLocalDay(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Relative last-visit copy for owner UI (local calendar days).
 */
export function formatRelativeLastVisit(
	iso: string | null,
	referenceDate: Date = new Date(),
): string {
	if (!iso) {
		return "Sin visitas";
	}

	const lastVisit = new Date(iso);

	if (Number.isNaN(lastVisit.getTime())) {
		return "Sin visitas";
	}

	const diffMs = startOfLocalDay(referenceDate).getTime() - startOfLocalDay(lastVisit).getTime();
	const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

	if (diffDays <= 0) {
		return "Hoy";
	}

	if (diffDays === 1) {
		return "Ayer";
	}

	return `Hace ${diffDays} días`;
}

export function formatCustomerZoneError(body: {
	error?: { description?: string };
}): string {
	return body.error?.description ?? "No se pudieron cargar los datos.";
}

const STATUS_LABELS: Record<CustomerEngagementStatus, string> = {
	vip: "VIP",
	active: "Activo",
	at_risk: "En riesgo",
	inactive: "Inactivo",
};

export function formatCustomerZoneStatus(status: CustomerEngagementStatus): string {
	return STATUS_LABELS[status];
}

const PROMOTION_TYPE_LABELS: Record<CustomerZoneDetailPromotion["type"], string> = {
	discount: "Descuento",
	bundle: "Pack",
	seasonal: "Temporada",
};

export function formatPromotionType(type: CustomerZoneDetailPromotion["type"]): string {
	return PROMOTION_TYPE_LABELS[type];
}

export function formatPromotionUsage(usedCount: number, maxUsesPerUser: number | null): string {
	if (maxUsesPerUser === null) {
		const label = usedCount === 1 ? "uso" : "usos";

		return `Sin límite · ${usedCount} ${label}`;
	}

	return `${usedCount}/${maxUsesPerUser} usos`;
}

const ROULETTE_SPIN_STATUS_LABELS: Record<CustomerZoneDetailRouletteSpin["status"], string> = {
	pending_redeem: "Pendiente de canje",
	applied: "Aplicado",
	expired: "Expirado",
};

export function formatRouletteSpinStatus(status: CustomerZoneDetailRouletteSpin["status"]): string {
	return ROULETTE_SPIN_STATUS_LABELS[status];
}

export function formatDaysSinceLastVisit(iso: string | null, referenceDate: Date = new Date()): string {
	if (!iso) {
		return "Sin visitas registradas";
	}

	const lastVisit = new Date(iso);

	if (Number.isNaN(lastVisit.getTime())) {
		return "Sin visitas registradas";
	}

	const diffMs = startOfLocalDay(referenceDate).getTime() - startOfLocalDay(lastVisit).getTime();
	const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

	if (diffDays <= 0) {
		return "Visitó hoy";
	}

	if (diffDays === 1) {
		return "No visita desde hace 1 día";
	}

	return `No visita desde hace ${diffDays} días`;
}
