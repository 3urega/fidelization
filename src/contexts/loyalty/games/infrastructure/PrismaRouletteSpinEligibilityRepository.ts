import { Service } from "diod";

import { prisma } from "../../../../lib/prisma";
import { RouletteSpinEligibility } from "../domain/RouletteSpinEligibility";
import { RouletteSpinEligibilityRepository } from "../domain/RouletteSpinEligibilityRepository";

@Service()
export class PrismaRouletteSpinEligibilityRepository extends RouletteSpinEligibilityRepository {
	async save(eligibility: RouletteSpinEligibility): Promise<void> {
		const p = eligibility.toPrimitives();

		await prisma.rouletteSpinEligibility.upsert({
			where: { id: p.id },
			create: {
				id: p.id,
				tenantId: p.tenantId,
				customerId: p.customerId,
				expiresAt: new Date(p.expiresAt),
				consumedAt: p.consumedAt ? new Date(p.consumedAt) : null,
				consumedSpinId: p.consumedSpinId,
				triggerRef: p.triggerRef,
				createdAt: new Date(p.createdAt),
			},
			update: {
				expiresAt: new Date(p.expiresAt),
				consumedAt: p.consumedAt ? new Date(p.consumedAt) : null,
				consumedSpinId: p.consumedSpinId,
				triggerRef: p.triggerRef,
				createdAt: new Date(p.createdAt),
			},
		});
	}

	async findActiveByCustomer(
		tenantId: string,
		customerId: string,
		at: Date = new Date(),
	): Promise<RouletteSpinEligibility | null> {
		const row = await prisma.rouletteSpinEligibility.findFirst({
			where: {
				tenantId,
				customerId,
				consumedAt: null,
				expiresAt: { gt: at },
			},
			orderBy: { createdAt: "desc" },
		});

		return row ? this.mapRow(row) : null;
	}

	async findUnconsumedByCustomer(
		tenantId: string,
		customerId: string,
	): Promise<RouletteSpinEligibility | null> {
		const row = await prisma.rouletteSpinEligibility.findFirst({
			where: {
				tenantId,
				customerId,
				consumedAt: null,
			},
			orderBy: { createdAt: "desc" },
		});

		return row ? this.mapRow(row) : null;
	}

	private mapRow(row: {
		id: string;
		tenantId: string;
		customerId: string;
		expiresAt: Date;
		consumedAt: Date | null;
		consumedSpinId: string | null;
		triggerRef: string | null;
		createdAt: Date;
	}): RouletteSpinEligibility {
		return RouletteSpinEligibility.fromPrimitives({
			id: row.id,
			tenantId: row.tenantId,
			customerId: row.customerId,
			expiresAt: row.expiresAt.toISOString(),
			consumedAt: row.consumedAt?.toISOString() ?? null,
			consumedSpinId: row.consumedSpinId,
			triggerRef: row.triggerRef,
			createdAt: row.createdAt.toISOString(),
		});
	}
}
