import { Service } from "diod";

import { prisma } from "../../../../lib/prisma";
import { StampType } from "../domain/StampType";
import { StampTypeRepository } from "../domain/StampTypeRepository";

@Service()
export class PrismaStampTypeRepository extends StampTypeRepository {
	async save(stampType: StampType): Promise<void> {
		const p = stampType.toPrimitives();

		await prisma.stampType.upsert({
			where: { id: p.id },
			create: {
				id: p.id,
				tenantId: p.tenantId,
				label: p.label,
				slug: p.slug,
				sortOrder: p.sortOrder,
				isActive: p.isActive,
			},
			update: {
				label: p.label,
				slug: p.slug,
				sortOrder: p.sortOrder,
				isActive: p.isActive,
			},
		});
	}

	async searchById(tenantId: string, id: string): Promise<StampType | null> {
		const row = await prisma.stampType.findFirst({
			where: { id, tenantId },
		});

		return row ? this.toDomain(row) : null;
	}

	async searchBySlug(tenantId: string, slug: string): Promise<StampType | null> {
		const row = await prisma.stampType.findFirst({
			where: { tenantId, slug },
		});

		return row ? this.toDomain(row) : null;
	}

	async listByTenant(tenantId: string): Promise<StampType[]> {
		const rows = await prisma.stampType.findMany({
			where: { tenantId },
			orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
		});

		return rows.map((row) => this.toDomain(row));
	}

	async listActiveByTenant(tenantId: string): Promise<StampType[]> {
		const rows = await prisma.stampType.findMany({
			where: { tenantId, isActive: true },
			orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
		});

		return rows.map((row) => this.toDomain(row));
	}

	async countActiveByTenant(tenantId: string): Promise<number> {
		return prisma.stampType.count({
			where: { tenantId, isActive: true },
		});
	}

	async maxSortOrder(tenantId: string): Promise<number> {
		const row = await prisma.stampType.findFirst({
			where: { tenantId },
			orderBy: { sortOrder: "desc" },
			select: { sortOrder: true },
		});

		return row?.sortOrder ?? 0;
	}

	private toDomain(row: {
		id: string;
		tenantId: string;
		label: string;
		slug: string;
		sortOrder: number;
		isActive: boolean;
	}): StampType {
		return StampType.fromPrimitives({
			id: row.id,
			tenantId: row.tenantId,
			label: row.label,
			slug: row.slug,
			sortOrder: row.sortOrder,
			isActive: row.isActive,
		});
	}
}
