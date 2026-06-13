import type { CustomerActivityRow } from "./CustomerDetail";
import type { CustomerAnalyticsRawRow } from "./CustomerAnalyticsRawRow";
import type { CustomerNearRewardProgress } from "./CustomerNearRewardProgress";
import type { CustomerRedeemedRewardRow } from "./CustomerDetail";

export type LoadCustomerAnalyticsSnapshotParams = {
	tenantId: string;
	monthStart: Date;
	monthEnd: Date;
};

export abstract class TenantCustomerAnalyticsRepository {
	abstract loadSnapshot(
		params: LoadCustomerAnalyticsSnapshotParams,
	): Promise<CustomerAnalyticsRawRow[]>;

	abstract loadNearRewardByTenant(
		tenantId: string,
	): Promise<Map<string, CustomerNearRewardProgress[]>>;

	abstract findCustomerBase(
		tenantId: string,
		customerId: string,
	): Promise<CustomerAnalyticsRawRow | null>;

	abstract loadRecentActivity(
		tenantId: string,
		customerId: string,
		limit: number,
	): Promise<CustomerActivityRow[]>;

	abstract loadRewardsRedeemed(
		tenantId: string,
		customerId: string,
	): Promise<CustomerRedeemedRewardRow[]>;
}
