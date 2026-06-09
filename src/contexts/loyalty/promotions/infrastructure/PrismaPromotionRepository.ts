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
				startDate: p.startDate ? new Date(p.startDate) : null,
				endDate: p.endDate ? new Date(p.endDate) : null,
				isActive: p.isActive,
			},
			update: {
				title: p.title,
				description: p.description,
				type: p.type,
				startDate: p.startDate ? new Date(p.startDate) : null,
				endDate: p.endDate ? new Date(p.endDate) : null,
				isActive: p.isActive,
			},
		});
	}

	async searchById(tenantId: string, id: string): Promise<Promotion | null> {
		const row = await prisma.promotion.findFirst({
			where: { id, tenantId },
		});

		return row ? this.mapRow(row) : null;
	}

	async listByTenant(tenantId: string): Promise<Promotion[]> {
		const rows = await prisma.promotion.findMany({
			where: { tenantId },
			orderBy: { createdAt: "desc" },
		});

		return rows.map((row) => this.mapRow(row));
	}

	async listActiveByTenantAt(tenantId: string, at: Date): Promise<Promotion[]> {
		const rows = await prisma.promotion.findMany({
			where: {
				tenantId,
				isActive: true,
				AND: [
					{
						OR: [{ startDate: null }, { startDate: { lte: at } }],
					},
					{
						OR: [{ endDate: null }, { endDate: { gte: at } }],
					},
				],
			},
			orderBy: { createdAt: "desc" },
		});

		return rows.map((row) => this.mapRow(row));
	}

	private mapRow(row: {
		id: string;
		tenantId: string;
		title: string;
		description: string;
		type: string;
		startDate: Date | null;
		endDate: Date | null;
		isActive: boolean;
	}): Promotion {
		return Promotion.fromPrimitives({
			id: row.id,
			tenantId: row.tenantId,
			title: row.title,
			description: row.description,
			type: row.type as PromotionType,
			startDate: row.startDate?.toISOString() ?? null,
			endDate: row.endDate?.toISOString() ?? null,
			isActive: row.isActive,
		});
	}
}
