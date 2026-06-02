import { Service } from "diod";

import { Prisma } from "../../../../../generated/prisma/client";
import { prisma } from "../../../../lib/prisma";
import { LoyaltyTransaction, LoyaltyTransactionType } from "../domain/LoyaltyTransaction";
import { LoyaltyTransactionRepository } from "../domain/LoyaltyTransactionRepository";

@Service()
export class PrismaLoyaltyTransactionRepository extends LoyaltyTransactionRepository {
	async save(transaction: LoyaltyTransaction): Promise<void> {
		const p = transaction.toPrimitives();

		await prisma.loyaltyTransaction.create({
			data: {
				id: p.id,
				tenantId: p.tenantId,
				customerId: p.customerId,
				type: p.type,
				points: p.points,
				metadata: p.metadata === null ? Prisma.JsonNull : (p.metadata as Prisma.InputJsonValue),
				createdByUserId: p.createdByUserId,
			},
		});
	}

	async searchById(tenantId: string, id: string): Promise<LoyaltyTransaction | null> {
		const row = await prisma.loyaltyTransaction.findFirst({
			where: { id, tenantId },
		});

		return row ? this.toAggregate(row) : null;
	}

	private toAggregate(row: {
		id: string;
		tenantId: string;
		customerId: string;
		type: string;
		points: number | null;
		metadata: unknown;
		createdByUserId: string | null;
	}): LoyaltyTransaction {
		return LoyaltyTransaction.fromPrimitives({
			id: row.id,
			tenantId: row.tenantId,
			customerId: row.customerId,
			type: row.type as LoyaltyTransactionType,
			points: row.points,
			metadata: row.metadata as Record<string, unknown> | null,
			createdByUserId: row.createdByUserId,
		});
	}
}
