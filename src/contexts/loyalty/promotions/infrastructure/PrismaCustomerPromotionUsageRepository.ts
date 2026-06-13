import { Service } from "diod";

import { prisma } from "../../../../lib/prisma";
import { CustomerPromotionUsage } from "../domain/CustomerPromotionUsage";
import { CustomerPromotionUsageRepository } from "../domain/CustomerPromotionUsageRepository";

@Service()
export class PrismaCustomerPromotionUsageRepository extends CustomerPromotionUsageRepository {
	async searchUsage(
		tenantId: string,
		customerId: string,
		promotionId: string,
	): Promise<CustomerPromotionUsage | null> {
		const row = await prisma.customerPromotionUsage.findFirst({
			where: { tenantId, customerId, promotionId },
		});

		return row ? this.mapRow(row) : null;
	}

	async saveUsage(usage: CustomerPromotionUsage): Promise<void> {
		const p = usage.toPrimitives();

		await prisma.customerPromotionUsage.upsert({
			where: {
				customerId_promotionId: {
					customerId: p.customerId,
					promotionId: p.promotionId,
				},
			},
			create: {
				id: p.id,
				tenantId: p.tenantId,
				customerId: p.customerId,
				promotionId: p.promotionId,
				usedCount: p.usedCount,
			},
			update: {
				usedCount: p.usedCount,
			},
		});
	}

	private mapRow(row: {
		id: string;
		tenantId: string;
		customerId: string;
		promotionId: string;
		usedCount: number;
	}): CustomerPromotionUsage {
		return CustomerPromotionUsage.fromPrimitives({
			id: row.id,
			tenantId: row.tenantId,
			customerId: row.customerId,
			promotionId: row.promotionId,
			usedCount: row.usedCount,
		});
	}
}
