import { env } from "../../../../../lib/env";
import type { CustomerAnalyticsRawRow } from "../../domain/analytics/CustomerAnalyticsRawRow";
import { CustomerEngagementClassifier } from "../../domain/analytics/CustomerEngagementClassifier";
import { CustomerEngagementTimeWindows } from "../../domain/analytics/CustomerEngagementTimeWindows";
import type { CustomerListRow } from "../../domain/analytics/CustomerListRow";
import type { CustomerSegment } from "../../domain/analytics/CustomerSegment";
import { TenantCustomerAnalyticsRepository } from "../../domain/analytics/TenantCustomerAnalyticsRepository";

export type CustomerEngagementSnapshotResult = {
	rawRows: CustomerAnalyticsRawRow[];
	listRows: CustomerListRow[];
	rawByCustomerId: Map<string, CustomerAnalyticsRawRow>;
	referenceDate: Date;
	timezone: string;
	monthStart: Date;
	monthEnd: Date;
};

export class CustomerEngagementSnapshot {
	static async load(
		repository: TenantCustomerAnalyticsRepository,
		tenantId: string,
		referenceDate: Date = new Date(),
	): Promise<CustomerEngagementSnapshotResult> {
		const timezone = env.appTimezone;
		const monthWindow = CustomerEngagementTimeWindows.forReference(referenceDate, timezone);
		const baseRows = await repository.loadSnapshot({
			tenantId,
			monthStart: monthWindow.start,
			monthEnd: monthWindow.end,
		});
		const nearRewardByCustomerId = await repository.loadNearRewardByTenant(tenantId);
		const rawRows = baseRows.map((row) => ({
			...row,
			nearRewardCampaigns: nearRewardByCustomerId.get(row.customerId) ?? [],
		}));
		const featuredIds = CustomerEngagementClassifier.resolveFeaturedCustomerIds(rawRows);
		const listRows = rawRows.map((row) =>
			CustomerEngagementClassifier.toListRow(row, featuredIds, referenceDate, timezone),
		);
		const rawByCustomerId = new Map(rawRows.map((row) => [row.customerId, row]));

		return {
			rawRows,
			listRows,
			rawByCustomerId,
			referenceDate,
			timezone,
			monthStart: monthWindow.start,
			monthEnd: monthWindow.end,
		};
	}

	static filterListRows(
		snapshot: CustomerEngagementSnapshotResult,
		segment: CustomerSegment,
	): CustomerListRow[] {
		return CustomerEngagementClassifier.filterBySegment(
			snapshot.listRows,
			segment,
			snapshot.rawByCustomerId,
			snapshot.referenceDate,
			snapshot.timezone,
		);
	}
}
