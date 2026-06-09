import { Service } from "diod";

import { prisma } from "../../../../lib/prisma";
import { Reward, RewardType } from "../domain/Reward";
import { RewardRepository } from "../domain/RewardRepository";

@Service()
export class PrismaRewardRepository extends RewardRepository {
	async save(reward: Reward): Promise<void> {
		const p = reward.toPrimitives();

		await prisma.reward.upsert({
			where: { id: p.id },
			create: {
				id: p.id,
				tenantId: p.tenantId,
				name: p.name,
				description: p.description,
				costPoints: p.costPoints,
				type: p.type,
				isActive: p.isActive,
				stockLimit: p.stockLimit,
			},
			update: {
				name: p.name,
				description: p.description,
				costPoints: p.costPoints,
				type: p.type,
				isActive: p.isActive,
				stockLimit: p.stockLimit,
			},
		});
	}

	async searchById(tenantId: string, id: string): Promise<Reward | null> {
		const row = await prisma.reward.findFirst({
			where: { id, tenantId },
		});

		return row ? this.toAggregate(row) : null;
	}

	async listByTenant(tenantId: string): Promise<Reward[]> {
		const rows = await prisma.reward.findMany({
			where: { tenantId },
			orderBy: { createdAt: "desc" },
		});

		return rows.map((row) => this.toAggregate(row));
	}

	private toAggregate(row: {
		id: string;
		tenantId: string;
		name: string;
		description: string;
		costPoints: number;
		type: string;
		isActive: boolean;
		stockLimit: number | null;
	}): Reward {
		return Reward.fromPrimitives({
			id: row.id,
			tenantId: row.tenantId,
			name: row.name,
			description: row.description,
			costPoints: row.costPoints,
			type: row.type as RewardType,
			isActive: row.isActive,
			stockLimit: row.stockLimit,
		});
	}
}
