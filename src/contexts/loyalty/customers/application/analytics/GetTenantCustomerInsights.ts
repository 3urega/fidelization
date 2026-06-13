import { Service } from "diod";

import { TenantRole } from "../../../../tenants/memberships/domain/TenantRole";
import { TenantAccessSuspended } from "../../../../tenants/tenants/domain/TenantAccessSuspended";
import { TenantNotFound } from "../../../../tenants/tenants/domain/TenantNotFound";
import { TenantRepository } from "../../../../tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../../../../tenants/tenants/domain/TenantStatus";
import { CustomerEngagementClassifier } from "../../domain/analytics/CustomerEngagementClassifier";
import type { CustomerInsightsSummary } from "../../domain/analytics/CustomerInsightsSummary";
import { CustomerZoneForbidden } from "../../domain/analytics/CustomerZoneForbidden";
import { TenantCustomerAnalyticsRepository } from "../../domain/analytics/TenantCustomerAnalyticsRepository";
import { CustomerEngagementSnapshot } from "./CustomerEngagementSnapshot";

export type GetTenantCustomerInsightsParams = {
	tenantId: string;
	role: TenantRole;
	referenceDate?: Date;
};

@Service()
export class GetTenantCustomerInsights {
	constructor(
		private readonly tenantRepository: TenantRepository,
		private readonly tenantCustomerAnalyticsRepository: TenantCustomerAnalyticsRepository,
	) {}

	async execute(params: GetTenantCustomerInsightsParams): Promise<CustomerInsightsSummary> {
		if (params.role !== TenantRole.Owner) {
			throw new CustomerZoneForbidden(params.role);
		}

		await this.assertTenantAllowsLoyalty(params.tenantId);

		const referenceDate = params.referenceDate ?? new Date();
		const snapshot = await CustomerEngagementSnapshot.load(
			this.tenantCustomerAnalyticsRepository,
			params.tenantId,
			referenceDate,
		);

		return CustomerEngagementClassifier.buildInsights({
			rows: snapshot.rawRows,
			referenceDate: snapshot.referenceDate,
			timezone: snapshot.timezone,
			monthStart: snapshot.monthStart,
			monthEnd: snapshot.monthEnd,
		});
	}

	private async assertTenantAllowsLoyalty(tenantId: string): Promise<void> {
		const tenant = await this.tenantRepository.findById(tenantId);
		if (!tenant) {
			throw new TenantNotFound(tenantId);
		}

		if (tenant.status === TenantStatus.Suspended) {
			throw new TenantAccessSuspended(tenantId);
		}
	}
}
