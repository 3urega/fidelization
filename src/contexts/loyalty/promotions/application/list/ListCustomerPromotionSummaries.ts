import { Service } from "diod";

import { ResolveTenantSubscriptionPlan } from "../../../../billing/subscriptions/application/resolve/ResolveTenantSubscriptionPlan";
import { isPlanFeatureEnabled } from "../../../../billing/subscriptions/domain/TenantPlanFeature";
import { TenantAccessSuspended } from "../../../../tenants/tenants/domain/TenantAccessSuspended";
import { TenantNotFound } from "../../../../tenants/tenants/domain/TenantNotFound";
import { TenantRepository } from "../../../../tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../../../../tenants/tenants/domain/TenantStatus";
import {
	customerPromotionSummaryFromPromotion,
	type CustomerPromotionSummary,
} from "../../domain/CustomerPromotionSummary";
import { CustomerPromotionUsageRepository } from "../../domain/CustomerPromotionUsageRepository";
import { PromotionRepository } from "../../domain/PromotionRepository";

export type ListCustomerPromotionSummariesParams = {
	tenantId: string;
	customerId?: string | null;
};

@Service()
export class ListCustomerPromotionSummaries {
	constructor(
		private readonly tenantRepository: TenantRepository,
		private readonly promotionRepository: PromotionRepository,
		private readonly customerPromotionUsageRepository: CustomerPromotionUsageRepository,
		private readonly resolveTenantSubscriptionPlan: ResolveTenantSubscriptionPlan,
	) {}

	async execute(params: ListCustomerPromotionSummariesParams): Promise<CustomerPromotionSummary[]> {
		await this.assertTenantAllowsLoyalty(params.tenantId);

		const plan = await this.resolveTenantSubscriptionPlan.execute(params.tenantId);
		if (!isPlanFeatureEnabled(plan.features, "promotions")) {
			return [];
		}

		const promotions = await this.promotionRepository.listActiveByTenantAt(
			params.tenantId,
			new Date(),
		);
		const summaries: CustomerPromotionSummary[] = [];

		for (const promotion of promotions) {
			let usedCount = 0;

			if (params.customerId) {
				const usage = await this.customerPromotionUsageRepository.searchUsage(
					params.tenantId,
					params.customerId,
					promotion.id,
				);
				usedCount = usage?.usedCount ?? 0;
			}

			summaries.push(customerPromotionSummaryFromPromotion(promotion, usedCount));
		}

		return summaries;
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
