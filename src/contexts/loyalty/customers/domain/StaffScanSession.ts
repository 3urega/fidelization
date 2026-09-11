import type { RouletteParticipationViewStatus } from "../../games/domain/RouletteParticipation";
import type { StampProgressSummary } from "./StampProgressSummary";

export type StaffScanSessionCustomerSummary = {
	id: string;
	name: string;
	pointsBalance: number;
	visitsCount: number;
};

export type StaffScanSessionStampBlockReason = "completed";

export type StaffScanSessionStampCard = StampProgressSummary & {
	canAddStamp: boolean;
	blockReason?: StaffScanSessionStampBlockReason;
};

export type StaffScanSessionPromotionBlockReason = "exhausted" | "inactive";

export type StaffScanSessionPromotion = {
	id: string;
	title: string;
	description: string;
	maxUsesPerUser: number | null;
	usedCount: number;
	canApply: boolean;
	blockReason?: StaffScanSessionPromotionBlockReason;
};

export type StaffScanSessionRouletteTenantContext = {
	unlockEnabled: boolean;
	authorizeEnabled: boolean;
	minPurchaseEuros: number | null;
};

export type StaffScanSessionTenantCapabilities = {
	stampCampaignsEnabled: boolean;
	promotionsEnabled: boolean;
	roulette: StaffScanSessionRouletteTenantContext | null;
	physicalRedeemEnabled: boolean;
};

export type StaffScanSessionRouletteParticipation = {
	status: RouletteParticipationViewStatus;
	enrolledAt: string | null;
	periodEndsAt: string | null;
	rules: {
		participationPeriodDays: number;
		maxSpinsInPeriod: number;
		maxSpinsPerDay: number;
		minPurchaseEuros: number | null;
		participationConditionsText: string | null;
		requiresEnrollment: boolean;
	};
	spinsUsedInPeriod: number;
	spinsRemainingInPeriod: number;
	spinsUsedToday: number;
	spinsRemainingToday: number;
	pendingAuthorization: { expiresAt: string } | null;
};

export type StaffScanSessionRoulette = {
	participation: StaffScanSessionRouletteParticipation;
	pendingPhysicalCount: number;
};

export type StaffScanSessionView = {
	customer: StaffScanSessionCustomerSummary;
	tenantCapabilities: StaffScanSessionTenantCapabilities;
	stampCards: StaffScanSessionStampCard[];
	promotions: StaffScanSessionPromotion[];
	roulette: StaffScanSessionRoulette | null;
};

export function resolveStaffScanStampCard(
	progress: StampProgressSummary,
): StaffScanSessionStampCard {
	const canAddStamp = !progress.completed;

	return {
		...progress,
		canAddStamp,
		blockReason: progress.completed ? "completed" : undefined,
	};
}

export function resolveStaffScanPromotion(input: {
	id: string;
	title: string;
	description: string;
	maxUsesPerUser: number | null;
	usedCount: number;
	isActive: boolean;
}): StaffScanSessionPromotion {
	if (!input.isActive) {
		return {
			id: input.id,
			title: input.title,
			description: input.description,
			maxUsesPerUser: input.maxUsesPerUser,
			usedCount: input.usedCount,
			canApply: false,
			blockReason: "inactive",
		};
	}

	const exhausted =
		input.maxUsesPerUser !== null && input.usedCount >= input.maxUsesPerUser;

	if (exhausted) {
		return {
			id: input.id,
			title: input.title,
			description: input.description,
			maxUsesPerUser: input.maxUsesPerUser,
			usedCount: input.usedCount,
			canApply: false,
			blockReason: "exhausted",
		};
	}

	return {
		id: input.id,
		title: input.title,
		description: input.description,
		maxUsesPerUser: input.maxUsesPerUser,
		usedCount: input.usedCount,
		canApply: true,
	};
}
