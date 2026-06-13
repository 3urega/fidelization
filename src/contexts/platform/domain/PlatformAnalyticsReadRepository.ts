import {
	type PlatformAnalyticsSummary,
	type PlatformAnalyticsSummaryParams,
} from "./PlatformAnalyticsSummary";

export abstract class PlatformAnalyticsReadRepository {
	abstract getSummary(params: PlatformAnalyticsSummaryParams): Promise<PlatformAnalyticsSummary>;
}
