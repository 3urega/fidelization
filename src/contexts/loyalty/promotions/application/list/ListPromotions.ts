import { Service } from "diod";

import { AssertTenantPlanFeature } from "../../../../billing/subscriptions/application/guard/AssertTenantPlanFeature";
import { TenantRole } from "../../../../tenants/memberships/domain/TenantRole";
import { TenantAccessSuspended } from "../../../../tenants/tenants/domain/TenantAccessSuspended";
import { TenantNotFound } from "../../../../tenants/tenants/domain/TenantNotFound";
import { TenantRepository } from "../../../../tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../../../../tenants/tenants/domain/TenantStatus";
import { Promotion } from "../../domain/Promotion";

export type ListPromotionsParams = {
	tenantId: string;
	role: TenantRole;
};

@Service()
export class ListPromotions {
	constructor(
		private readonly tenantRepository: TenantRepository,
		private readonly assertTenantPlanFeature: AssertTenantPlanFeature,
	) {}

	async execute(params: ListPromotionsParams): Promise<Promotion[]> {
		if (params.role !== TenantRole.Owner && params.role !== TenantRole.Employee) {
			throw new Error("Only owner or employee can list promotions");
		}

		await this.assertTenantAllowsLoyalty(params.tenantId);
		await this.assertTenantPlanFeature.execute({
			tenantId: params.tenantId,
			feature: "promotions",
		});

		return [];
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
