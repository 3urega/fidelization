import { Service } from "diod";

import { CustomerRepository } from "../../../customers/domain/CustomerRepository";
import { Promotion } from "../../domain/Promotion";
import { ListActivePromotionsForCustomer } from "./ListActivePromotionsForCustomer";

export const MAX_CROSS_TENANT_PROMOTIONS = 5;

export type CrossTenantPromotionGroup = {
	tenantId: string;
	tenantName: string;
	tenantSlug: string;
	promotions: Promotion[];
};

export type ListUserCrossTenantPromotionsParams = {
	userId: string;
	excludeTenantSlug: string;
};

@Service()
export class ListUserCrossTenantPromotions {
	constructor(
		private readonly customerRepository: CustomerRepository,
		private readonly listActivePromotionsForCustomer: ListActivePromotionsForCustomer,
	) {}

	async execute(params: ListUserCrossTenantPromotionsParams): Promise<CrossTenantPromotionGroup[]> {
		const excludeSlug = params.excludeTenantSlug.trim().toLowerCase();
		const establishments = await this.customerRepository.listWithInteractionByUserId(params.userId);
		const groups: CrossTenantPromotionGroup[] = [];
		let remaining = MAX_CROSS_TENANT_PROMOTIONS;

		for (const establishment of establishments) {
			if (remaining <= 0) {
				break;
			}

			if (establishment.slug === excludeSlug) {
				continue;
			}

			const promotions = await this.listActivePromotionsForCustomer.execute({
				tenantId: establishment.tenantId,
			});

			if (promotions.length === 0) {
				continue;
			}

			const slice = promotions.slice(0, remaining);
			remaining -= slice.length;

			groups.push({
				tenantId: establishment.tenantId,
				tenantName: establishment.name,
				tenantSlug: establishment.slug,
				promotions: slice,
			});
		}

		return groups;
	}
}
