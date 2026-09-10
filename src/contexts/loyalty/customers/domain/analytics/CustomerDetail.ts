import type { CustomerEngagementStatus } from "./CustomerEngagementStatus";
import type { PromotionType } from "../../../promotions/domain/Promotion";
import type { RoulettePrizeType } from "../../../games/domain/RoulettePrizeType";
import type { RouletteSpinStatus } from "../../../games/domain/RouletteSpin";

export type CustomerActivityRow = {
	occurredAt: Date;
	label: string;
};

export type CustomerRedeemedRewardRow = {
	rewardName: string;
	redeemedAt: Date;
};

export type CustomerDetailStampProgress = {
	campaignId: string;
	campaignName: string;
	current: number;
	required: number;
	completed: boolean;
	stampTypeLabel: string;
};

export type CustomerDetailPromotion = {
	id: string;
	title: string;
	type: PromotionType;
	isActive: boolean;
	usedCount: number;
	maxUsesPerUser: number | null;
};

export type CustomerDetailRouletteSpin = {
	id: string;
	segmentLabel: string;
	prizeType: RoulettePrizeType;
	status: RouletteSpinStatus;
	createdAt: Date;
	redeemedAt: Date | null;
};

export type CustomerDetailView = {
	id: string;
	name: string;
	email: string | null;
	phone: string | null;
	customerSince: Date;
	visitsCount: number;
	pointsBalance: number;
	status: CustomerEngagementStatus;
	stampProgress: CustomerDetailStampProgress[];
	recentActivity: CustomerActivityRow[];
	rewardsRedeemed: CustomerRedeemedRewardRow[];
	promotions: CustomerDetailPromotion[];
	rouletteSpins: CustomerDetailRouletteSpin[];
};
