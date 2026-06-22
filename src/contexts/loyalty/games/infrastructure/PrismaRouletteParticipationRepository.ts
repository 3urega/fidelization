import { Service } from "diod";

import { prisma } from "../../../../lib/prisma";
import { RouletteParticipation, type RouletteParticipationStatus } from "../domain/RouletteParticipation";
import { RouletteParticipationRepository } from "../domain/RouletteParticipationRepository";

@Service()
export class PrismaRouletteParticipationRepository extends RouletteParticipationRepository {
	async save(participation: RouletteParticipation): Promise<void> {
		const p = participation.toPrimitives();

		await prisma.rouletteParticipation.upsert({
			where: {
				tenantId_customerId: {
					tenantId: p.tenantId,
					customerId: p.customerId,
				},
			},
			create: {
				id: p.id,
				tenantId: p.tenantId,
				customerId: p.customerId,
				enrolledAt: new Date(p.enrolledAt),
				periodEndsAt: new Date(p.periodEndsAt),
				status: p.status,
				createdAt: new Date(p.createdAt),
				updatedAt: new Date(p.updatedAt),
			},
			update: {
				enrolledAt: new Date(p.enrolledAt),
				periodEndsAt: new Date(p.periodEndsAt),
				status: p.status,
				updatedAt: new Date(p.updatedAt),
			},
		});
	}

	async findByTenantAndCustomer(
		tenantId: string,
		customerId: string,
	): Promise<RouletteParticipation | null> {
		const row = await prisma.rouletteParticipation.findUnique({
			where: {
				tenantId_customerId: {
					tenantId,
					customerId,
				},
			},
		});

		return row ? this.mapRow(row) : null;
	}

	private mapRow(row: {
		id: string;
		tenantId: string;
		customerId: string;
		enrolledAt: Date;
		periodEndsAt: Date;
		status: string;
		createdAt: Date;
		updatedAt: Date;
	}): RouletteParticipation {
		return RouletteParticipation.fromPrimitives({
			id: row.id,
			tenantId: row.tenantId,
			customerId: row.customerId,
			enrolledAt: row.enrolledAt.toISOString(),
			periodEndsAt: row.periodEndsAt.toISOString(),
			status: row.status as RouletteParticipationStatus,
			createdAt: row.createdAt.toISOString(),
			updatedAt: row.updatedAt.toISOString(),
		});
	}
}
