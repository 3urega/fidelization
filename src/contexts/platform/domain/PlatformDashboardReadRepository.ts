import {
	type PlatformDashboardMetrics,
	type PlatformDashboardMetricsParams,
} from "../domain/PlatformDashboardMetrics";

export abstract class PlatformDashboardReadRepository {
	abstract getMetrics(params: PlatformDashboardMetricsParams): Promise<PlatformDashboardMetrics>;
}
