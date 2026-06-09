import { Service } from "diod";

import { ResolveTenantSubscriptionPlan } from "../../../../billing/subscriptions/application/resolve/ResolveTenantSubscriptionPlan";
import { isPlanFeatureEnabled } from "../../../../billing/subscriptions/domain/TenantPlanFeature";
import { TenantAccessSuspended } from "../../../../tenants/tenants/domain/TenantAccessSuspended";
import { TenantNotFound } from "../../../../tenants/tenants/domain/TenantNotFound";
import { TenantRepository } from "../../../../tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../../../../tenants/tenants/domain/TenantStatus";
import { Promotion } from "../../domain/Promotion";
import { PromotionRepository } from "../../domain/PromotionRepository";

export type ListActivePromotionsForCustomerParams = {
	tenantId: string;
};

@Service()
export class ListActivePromotionsForCustomer {
	constructor(
		private readonly tenantRepository: TenantRepository,
		private readonly promotionRepository: PromotionRepository,
		private readonly resolveTenantSubscriptionPlan: ResolveTenantSubscriptionPlan,
	) {}

	async execute(params: ListActivePromotionsForCustomerParams): Promise<Promotion[]> {
		await this.assertTenantAllowsLoyalty(params.tenantId);

		const plan = await this.resolveTenantSubscriptionPlan.execute(params.tenantId);
		if (!isPlanFeatureEnabled(plan.features, "promotions")) {
			return [];
		}

		return this.promotionRepository.listActiveByTenantAt(params.tenantId, new Date());
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
