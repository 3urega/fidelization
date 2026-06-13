import { CustomerPromotionUsage } from "./CustomerPromotionUsage";

export abstract class CustomerPromotionUsageRepository {
	abstract searchUsage(
		tenantId: string,
		customerId: string,
		promotionId: string,
	): Promise<CustomerPromotionUsage | null>;

	abstract saveUsage(usage: CustomerPromotionUsage): Promise<void>;
}
