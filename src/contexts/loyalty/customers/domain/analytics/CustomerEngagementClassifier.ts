import { startOfZonedDayUtc } from "../../../../../lib/time/zonedCalendarWindows";
import type { CustomerAnalyticsRawRow } from "./CustomerAnalyticsRawRow";
import type { CustomerEngagementStatus } from "./CustomerEngagementStatus";
import type { CustomerInsightsSummary } from "./CustomerInsightsSummary";
import type { CustomerListRow } from "./CustomerListRow";
import type { CustomerNearRewardProgress } from "./CustomerNearRewardProgress";
import {
	ALL_CUSTOMERS_LIST_LIMIT,
	type CustomerSegment,
} from "./CustomerSegment";

/** Top N clients by visits in the current calendar month. */
export const FEATURED_TOP_N = 10;

/** Segment "at risk": no visit for at least this many natural days. */
export const AT_RISK_SEGMENT_MIN_DAYS = 21;

/** Badge "active": last visit fewer than this many days ago. */
export const BADGE_ACTIVE_MAX_DAYS = 13;

/** Badge "at_risk": last visit between 14 and 44 days ago (inclusive). */
export const BADGE_AT_RISK_MIN_DAYS = 14;
export const BADGE_AT_RISK_MAX_DAYS = 44;

/** Badge "inactive": last visit at least this many days ago. */
export const BADGE_INACTIVE_MIN_DAYS = 45;

export type CustomerEngagementClassifierInput = {
	rows: CustomerAnalyticsRawRow[];
	referenceDate: Date;
	timezone: string;
	monthStart: Date;
	monthEnd: Date;
};

export class CustomerEngagementClassifier {
	static resolveFeaturedCustomerIds(rows: CustomerAnalyticsRawRow[]): Set<string> {
		const ranked = [...rows]
			.filter((row) => row.visitsThisMonth > 0)
			.sort((left, right) => {
				if (right.visitsThisMonth !== left.visitsThisMonth) {
					return right.visitsThisMonth - left.visitsThisMonth;
				}

				return left.name.localeCompare(right.name, "es");
			});

		return new Set(ranked.slice(0, FEATURED_TOP_N).map((row) => row.customerId));
	}

	static daysSinceLastVisit(
		lastVisitAt: Date | null,
		referenceDate: Date,
		timezone: string,
	): number | null {
		if (!lastVisitAt) {
			return null;
		}

		const referenceDayStart = startOfZonedDayUtc(referenceDate, timezone);
		const lastVisitDayStart = startOfZonedDayUtc(lastVisitAt, timezone);
		const diffMs = referenceDayStart.getTime() - lastVisitDayStart.getTime();

		return Math.floor(diffMs / (24 * 60 * 60 * 1000));
	}

	static isAtRiskSegment(daysSinceLastVisit: number | null): boolean {
		if (daysSinceLastVisit === null) {
			return true;
		}

		return daysSinceLastVisit >= AT_RISK_SEGMENT_MIN_DAYS;
	}

	static isNearRewardSegment(nearRewardCampaigns: CustomerNearRewardProgress[]): boolean {
		return nearRewardCampaigns.length > 0;
	}

	static resolveBadgeStatus(
		isVip: boolean,
		daysSinceLastVisit: number | null,
	): CustomerEngagementStatus {
		if (isVip) {
			return "vip";
		}

		if (daysSinceLastVisit === null || daysSinceLastVisit >= BADGE_INACTIVE_MIN_DAYS) {
			return "inactive";
		}

		if (daysSinceLastVisit <= BADGE_ACTIVE_MAX_DAYS) {
			return "active";
		}

		if (daysSinceLastVisit <= BADGE_AT_RISK_MAX_DAYS) {
			return "at_risk";
		}

		return "inactive";
	}

	static pickPrimaryNearReward(
		nearRewardCampaigns: CustomerNearRewardProgress[],
	): CustomerNearRewardProgress | undefined {
		if (nearRewardCampaigns.length === 0) {
			return undefined;
		}

		return [...nearRewardCampaigns].sort((left, right) => {
			const leftRemaining = left.required - left.current;
			const rightRemaining = right.required - right.current;

			if (leftRemaining !== rightRemaining) {
				return leftRemaining - rightRemaining;
			}

			return left.campaignName.localeCompare(right.campaignName, "es");
		})[0];
	}

	static toListRow(
		row: CustomerAnalyticsRawRow,
		featuredIds: Set<string>,
		referenceDate: Date,
		timezone: string,
	): CustomerListRow {
		const daysSince = CustomerEngagementClassifier.daysSinceLastVisit(
			row.lastVisitAt,
			referenceDate,
			timezone,
		);
		const isVip = featuredIds.has(row.customerId);
		const nearReward = CustomerEngagementClassifier.pickPrimaryNearReward(row.nearRewardCampaigns);

		return {
			id: row.customerId,
			name: row.name,
			lastVisitAt: row.lastVisitAt,
			visitsThisMonth: row.visitsThisMonth,
			visitsCount: row.visitsCount,
			totalStamps: row.totalStamps,
			rewardsRedeemedCount: row.rewardsRedeemedCount,
			status: CustomerEngagementClassifier.resolveBadgeStatus(isVip, daysSince),
			nearReward,
		};
	}

	static buildInsights(input: CustomerEngagementClassifierInput): CustomerInsightsSummary {
		const featuredIds = CustomerEngagementClassifier.resolveFeaturedCustomerIds(input.rows);
		let atRiskCount = 0;
		let nearRewardCount = 0;
		let newThisMonthCount = 0;

		for (const row of input.rows) {
			const daysSince = CustomerEngagementClassifier.daysSinceLastVisit(
				row.lastVisitAt,
				input.referenceDate,
				input.timezone,
			);

			if (CustomerEngagementClassifier.isAtRiskSegment(daysSince)) {
				atRiskCount += 1;
			}

			if (CustomerEngagementClassifier.isNearRewardSegment(row.nearRewardCampaigns)) {
				nearRewardCount += 1;
			}

			if (row.createdAt >= input.monthStart && row.createdAt < input.monthEnd) {
				newThisMonthCount += 1;
			}
		}

		return {
			vipCount: featuredIds.size,
			atRiskCount,
			nearRewardCount,
			newThisMonthCount,
			generatedAt: input.referenceDate,
			timezone: input.timezone,
		};
	}

	static filterBySegment(
		rows: CustomerListRow[],
		segment: CustomerSegment,
		rawByCustomerId: Map<string, CustomerAnalyticsRawRow>,
		referenceDate: Date,
		timezone: string,
	): CustomerListRow[] {
		switch (segment) {
			case "featured": {
				const featuredIds = CustomerEngagementClassifier.resolveFeaturedCustomerIds(
					Array.from(rawByCustomerId.values()),
				);

				return rows
					.filter((row) => featuredIds.has(row.id))
					.sort((left, right) => {
						if (right.visitsThisMonth !== left.visitsThisMonth) {
							return right.visitsThisMonth - left.visitsThisMonth;
						}

						return left.name.localeCompare(right.name, "es");
					});
			}
			case "at_risk":
				return rows
					.filter((row) => {
						const raw = rawByCustomerId.get(row.id);
						if (!raw) {
							return false;
						}

						const daysSince = CustomerEngagementClassifier.daysSinceLastVisit(
							raw.lastVisitAt,
							referenceDate,
							timezone,
						);

						return CustomerEngagementClassifier.isAtRiskSegment(daysSince);
					})
					.sort((left, right) => {
						const leftDays =
							CustomerEngagementClassifier.daysSinceLastVisit(
								rawByCustomerId.get(left.id)?.lastVisitAt ?? null,
								referenceDate,
								timezone,
							) ?? Number.MAX_SAFE_INTEGER;
						const rightDays =
							CustomerEngagementClassifier.daysSinceLastVisit(
								rawByCustomerId.get(right.id)?.lastVisitAt ?? null,
								referenceDate,
								timezone,
							) ?? Number.MAX_SAFE_INTEGER;

						if (rightDays !== leftDays) {
							return rightDays - leftDays;
						}

						return left.name.localeCompare(right.name, "es");
					});
			case "near_reward":
				return rows
					.filter((row) => row.nearReward !== undefined)
					.sort((left, right) => {
						const leftRemaining =
							(left.nearReward?.required ?? 0) - (left.nearReward?.current ?? 0);
						const rightRemaining =
							(right.nearReward?.required ?? 0) - (right.nearReward?.current ?? 0);

						if (leftRemaining !== rightRemaining) {
							return leftRemaining - rightRemaining;
						}

						return left.name.localeCompare(right.name, "es");
					});
			case "all":
				return rows
					.sort((left, right) => {
						if (left.lastVisitAt && right.lastVisitAt) {
							const diff = right.lastVisitAt.getTime() - left.lastVisitAt.getTime();
							if (diff !== 0) {
								return diff;
							}
						} else if (left.lastVisitAt && !right.lastVisitAt) {
							return -1;
						} else if (!left.lastVisitAt && right.lastVisitAt) {
							return 1;
						}

						return left.name.localeCompare(right.name, "es");
					})
					.slice(0, ALL_CUSTOMERS_LIST_LIMIT);
		}
	}
}
