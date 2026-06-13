import type { CustomerEngagementStatus } from "./CustomerEngagementStatus";
import type { CustomerNearRewardProgress } from "./CustomerNearRewardProgress";

export type CustomerListRow = {
	id: string;
	name: string;
	lastVisitAt: Date | null;
	visitsThisMonth: number;
	visitsCount: number;
	totalStamps: number;
	rewardsRedeemedCount: number;
	status: CustomerEngagementStatus;
	nearReward?: CustomerNearRewardProgress;
};
