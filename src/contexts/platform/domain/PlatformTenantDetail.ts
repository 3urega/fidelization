import type { SubscriptionPlan } from "../../billing/subscriptions/domain/SubscriptionPlan";
import type { Tenant } from "../../tenants/tenants/domain/Tenant";

export type PlatformTenantOwnerSummary = {
	userId: string;
	name: string;
	email: string;
};

export type PlatformTenantActivityCounts = {
	customersCount: number;
	staffCount: number;
	qrScansCount: number;
};

export type PlatformTenantDetail = {
	tenant: Tenant;
	owners: PlatformTenantOwnerSummary[];
	activity: PlatformTenantActivityCounts;
	availablePlans: SubscriptionPlan[];
};
