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
