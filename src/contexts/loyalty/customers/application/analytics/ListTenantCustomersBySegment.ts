import { Service } from "diod";

import { TenantRole } from "../../../../tenants/memberships/domain/TenantRole";
import { TenantAccessSuspended } from "../../../../tenants/tenants/domain/TenantAccessSuspended";
import { TenantNotFound } from "../../../../tenants/tenants/domain/TenantNotFound";
import { TenantRepository } from "../../../../tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../../../../tenants/tenants/domain/TenantStatus";
import type { CustomerListRow } from "../../domain/analytics/CustomerListRow";
import type { CustomerSegment } from "../../domain/analytics/CustomerSegment";
import { CustomerZoneForbidden } from "../../domain/analytics/CustomerZoneForbidden";
import { TenantCustomerAnalyticsRepository } from "../../domain/analytics/TenantCustomerAnalyticsRepository";
import { CustomerEngagementSnapshot } from "./CustomerEngagementSnapshot";

export type ListTenantCustomersBySegmentParams = {
	tenantId: string;
	role: TenantRole;
	segment: CustomerSegment;
	referenceDate?: Date;
};

export type ListTenantCustomersBySegmentResult = {
	customers: CustomerListRow[];
	generatedAt: Date;
	timezone: string;
	segment: CustomerSegment;
};

@Service()
export class ListTenantCustomersBySegment {
	constructor(
		private readonly tenantRepository: TenantRepository,
		private readonly tenantCustomerAnalyticsRepository: TenantCustomerAnalyticsRepository,
	) {}

	async execute(
		params: ListTenantCustomersBySegmentParams,
	): Promise<ListTenantCustomersBySegmentResult> {
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
		const customers = CustomerEngagementSnapshot.filterListRows(snapshot, params.segment);

		return {
			customers,
			generatedAt: snapshot.referenceDate,
			timezone: snapshot.timezone,
			segment: params.segment,
		};
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
