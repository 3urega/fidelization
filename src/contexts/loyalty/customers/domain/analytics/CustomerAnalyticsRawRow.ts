import type { CustomerNearRewardProgress } from "./CustomerNearRewardProgress";

export type CustomerAnalyticsRawRow = {
	customerId: string;
	name: string;
	email: string | null;
	phone: string | null;
	createdAt: Date;
	visitsCount: number;
	pointsBalance: number;
	lastVisitAt: Date | null;
	visitsThisMonth: number;
	totalStamps: number;
	rewardsRedeemedCount: number;
	nearRewardCampaigns: CustomerNearRewardProgress[];
};
