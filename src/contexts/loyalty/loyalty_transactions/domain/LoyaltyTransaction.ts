import { randomUUID } from "crypto";

export type LoyaltyTransactionType =
	| "points_earned"
	| "points_redeemed"
	| "stamp_added"
	| "reward_redeemed"
	| "manual_adjustment";

export type LoyaltyTransactionPrimitives = {
	id: string;
	tenantId: string;
	customerId: string;
	type: LoyaltyTransactionType;
	points: number | null;
	metadata: Record<string, unknown> | null;
	createdByUserId: string | null;
};

export class LoyaltyTransaction {
	private constructor(
		public readonly id: string,
		public readonly tenantId: string,
		public readonly customerId: string,
		public readonly type: LoyaltyTransactionType,
		public readonly points: number | null,
		public readonly metadata: Record<string, unknown> | null,
		public readonly createdByUserId: string | null,
	) {}

	static recordPointsEarned(params: {
		tenantId: string;
		customerId: string;
		points: number;
		createdByUserId: string;
		metadata?: Record<string, unknown> | null;
	}): LoyaltyTransaction {
		return LoyaltyTransaction.fromPrimitives({
			id: randomUUID(),
			tenantId: params.tenantId,
			customerId: params.customerId,
			type: "points_earned",
			points: params.points,
			metadata: params.metadata ?? null,
			createdByUserId: params.createdByUserId,
		});
	}

	static recordStampAdded(params: {
		tenantId: string;
		customerId: string;
		createdByUserId: string;
		metadata?: Record<string, unknown> | null;
	}): LoyaltyTransaction {
		return LoyaltyTransaction.fromPrimitives({
			id: randomUUID(),
			tenantId: params.tenantId,
			customerId: params.customerId,
			type: "stamp_added",
			points: null,
			metadata: params.metadata ?? null,
			createdByUserId: params.createdByUserId,
		});
	}

	static recordRewardRedeemed(params: {
		tenantId: string;
		customerId: string;
		points: number;
		metadata?: Record<string, unknown> | null;
	}): LoyaltyTransaction {
		return LoyaltyTransaction.fromPrimitives({
			id: randomUUID(),
			tenantId: params.tenantId,
			customerId: params.customerId,
			type: "reward_redeemed",
			points: params.points,
			metadata: params.metadata ?? null,
			createdByUserId: null,
		});
	}

	static fromPrimitives(primitives: LoyaltyTransactionPrimitives): LoyaltyTransaction {
		return new LoyaltyTransaction(
			primitives.id,
			primitives.tenantId,
			primitives.customerId,
			primitives.type,
			primitives.points,
			primitives.metadata,
			primitives.createdByUserId,
		);
	}

	toPrimitives(): LoyaltyTransactionPrimitives {
		return {
			id: this.id,
			tenantId: this.tenantId,
			customerId: this.customerId,
			type: this.type,
			points: this.points,
			metadata: this.metadata,
			createdByUserId: this.createdByUserId,
		};
	}
}
