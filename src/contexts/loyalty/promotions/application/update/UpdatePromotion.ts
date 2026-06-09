import { Service } from "diod";

import { AssertTenantPlanFeature } from "../../../../billing/subscriptions/application/guard/AssertTenantPlanFeature";
import { TenantRole } from "../../../../tenants/memberships/domain/TenantRole";
import { TenantAccessSuspended } from "../../../../tenants/tenants/domain/TenantAccessSuspended";
import { TenantNotFound } from "../../../../tenants/tenants/domain/TenantNotFound";
import { TenantRepository } from "../../../../tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../../../../tenants/tenants/domain/TenantStatus";
import { Promotion } from "../../domain/Promotion";
import { PromotionForbidden } from "../../domain/PromotionForbidden";
import { PromotionNotFound } from "../../domain/PromotionNotFound";
import { PromotionRepository } from "../../domain/PromotionRepository";
import { parsePromotionDeactivate } from "../../domain/PromotionUpdateInput";

export type UpdatePromotionParams = {
	tenantId: string;
	role: TenantRole;
	promotionId: string;
	input: {
		isActive?: boolean;
	};
};

@Service()
export class UpdatePromotion {
	constructor(
		private readonly tenantRepository: TenantRepository,
		private readonly promotionRepository: PromotionRepository,
		private readonly assertTenantPlanFeature: AssertTenantPlanFeature,
	) {}

	async execute(params: UpdatePromotionParams): Promise<Promotion> {
		if (params.role !== TenantRole.Owner) {
			throw new PromotionForbidden(params.role);
		}

		await this.assertTenantAllowsLoyalty(params.tenantId);
		await this.assertTenantPlanFeature.execute({
			tenantId: params.tenantId,
			feature: "promotions",
		});

		parsePromotionDeactivate(params.input);

		const existing = await this.promotionRepository.searchById(
			params.tenantId,
			params.promotionId,
		);

		if (!existing) {
			throw new PromotionNotFound(params.promotionId);
		}

		const updated = existing.deactivate();
		await this.promotionRepository.save(updated);

		return updated;
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
