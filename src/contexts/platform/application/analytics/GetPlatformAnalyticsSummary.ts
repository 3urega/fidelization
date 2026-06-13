import { Service } from "diod";

import { env } from "../../../../lib/env";
import {
	PLATFORM_ANALYTICS_ALLOWED_PERIOD_DAYS,
	type PlatformAnalyticsPeriodDays,
	type PlatformAnalyticsSummary,
} from "../../domain/PlatformAnalyticsSummary";
import { PlatformAnalyticsReadRepository } from "../../domain/PlatformAnalyticsReadRepository";

export type GetPlatformAnalyticsSummaryParams = {
	referenceDate?: Date;
	periodDays?: number;
};

@Service()
export class GetPlatformAnalyticsSummary {
	constructor(private readonly repository: PlatformAnalyticsReadRepository) {}

	async execute(params: GetPlatformAnalyticsSummaryParams = {}): Promise<PlatformAnalyticsSummary> {
		const referenceDate = params.referenceDate ?? new Date();
		const periodDays = normalizePeriodDays(params.periodDays);
		const timezone = env.appTimezone;

		return this.repository.getSummary({ referenceDate, timezone, periodDays });
	}
}

function normalizePeriodDays(value: number | undefined): PlatformAnalyticsPeriodDays {
	if (value === undefined || value === 7) {
		return 7;
	}

	if (value === 30) {
		return 30;
	}

	throw new Error(`periodDays must be one of: ${PLATFORM_ANALYTICS_ALLOWED_PERIOD_DAYS.join(", ")}`);
}
