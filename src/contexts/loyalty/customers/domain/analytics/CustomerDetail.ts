import type { CustomerEngagementStatus } from "./CustomerEngagementStatus";

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
};
