import { Service } from "diod";

import { prisma } from "../../../../lib/prisma";
import { Promotion, PromotionType } from "../domain/Promotion";
import { PromotionRepository } from "../domain/PromotionRepository";

@Service()
export class PrismaPromotionRepository extends PromotionRepository {
	async save(promotion: Promotion): Promise<void> {
		const p = promotion.toPrimitives();

		await prisma.promotion.upsert({
			where: { id: p.id },
			create: {
				id: p.id,
				tenantId: p.tenantId,
				title: p.title,
				description: p.description,
				type: p.type,
				isActive: p.isActive,
			},
			update: {
				title: p.title,
				description: p.description,
				type: p.type,
				isActive: p.isActive,
			},
		});
	}

	async searchById(tenantId: string, id: string): Promise<Promotion | null> {
		const row = await prisma.promotion.findFirst({
			where: { id, tenantId },
		});

		return row
			? Promotion.fromPrimitives({
					id: row.id,
					tenantId: row.tenantId,
					title: row.title,
					description: row.description,
					type: row.type as PromotionType,
					isActive: row.isActive,
				})
			: null;
	}
}
