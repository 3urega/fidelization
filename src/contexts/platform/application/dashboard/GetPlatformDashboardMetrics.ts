import { Service } from "diod";

import { env } from "../../../../lib/env";
import { type PlatformDashboardMetrics } from "../../domain/PlatformDashboardMetrics";
import { PlatformDashboardReadRepository } from "../../domain/PlatformDashboardReadRepository";

export type GetPlatformDashboardMetricsParams = {
	referenceDate?: Date;
};

export type GetPlatformDashboardMetricsResult = PlatformDashboardMetrics;

@Service()
export class GetPlatformDashboardMetrics {
	constructor(private readonly repository: PlatformDashboardReadRepository) {}

	async execute(params: GetPlatformDashboardMetricsParams = {}): Promise<GetPlatformDashboardMetricsResult> {
		const referenceDate = params.referenceDate ?? new Date();
		const timezone = env.appTimezone;

		return this.repository.getMetrics({ referenceDate, timezone });
	}
}
