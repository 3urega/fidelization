import { Service } from "diod";

import { AssertTenantPlanFeature } from "../../../../billing/subscriptions/application/guard/AssertTenantPlanFeature";
import { TenantRole } from "../../../../tenants/memberships/domain/TenantRole";
import { TenantAccessSuspended } from "../../../../tenants/tenants/domain/TenantAccessSuspended";
import { TenantNotFound } from "../../../../tenants/tenants/domain/TenantNotFound";
import { TenantRepository } from "../../../../tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../../../../tenants/tenants/domain/TenantStatus";
import { Promotion } from "../../domain/Promotion";
import { parsePromotionCreate } from "../../domain/PromotionCreateInput";
import { PromotionForbidden } from "../../domain/PromotionForbidden";
import { PromotionRepository } from "../../domain/PromotionRepository";

export type CreatePromotionParams = {
	tenantId: string;
	role: TenantRole;
	input: {
		title?: string;
		description?: string;
		type?: string;
		startDate?: string;
		endDate?: string;
		maxUsesPerUser?: unknown;
	};
};

@Service()
export class CreatePromotion {
	constructor(
		private readonly tenantRepository: TenantRepository,
		private readonly promotionRepository: PromotionRepository,
		private readonly assertTenantPlanFeature: AssertTenantPlanFeature,
	) {}

	async execute(params: CreatePromotionParams): Promise<Promotion> {
		if (params.role !== TenantRole.Owner) {
			throw new PromotionForbidden(params.role);
		}

		await this.assertTenantAllowsLoyalty(params.tenantId);
		await this.assertTenantPlanFeature.execute({
			tenantId: params.tenantId,
			feature: "promotions",
		});

		const parsed = parsePromotionCreate(params.input);
		const promotion = Promotion.create({
			tenantId: params.tenantId,
			title: parsed.title,
			description: parsed.description,
			type: parsed.type,
			startDate: parsed.startDate,
			endDate: parsed.endDate,
			maxUsesPerUser: parsed.maxUsesPerUser,
		});

		await this.promotionRepository.save(promotion);

		return promotion;
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
