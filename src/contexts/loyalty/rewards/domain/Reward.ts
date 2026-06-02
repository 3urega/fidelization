export type RewardType = "free_item" | "discount" | "custom";

export type RewardPrimitives = {
	id: string;
	tenantId: string;
	name: string;
	description: string;
	costPoints: number;
	type: RewardType;
	isActive: boolean;
	stockLimit: number | null;
};

export class Reward {
	private constructor(
		public readonly id: string,
		public readonly tenantId: string,
		public readonly name: string,
		public readonly description: string,
		public readonly costPoints: number,
		public readonly type: RewardType,
		public readonly isActive: boolean,
		public readonly stockLimit: number | null,
	) {}

	static fromPrimitives(primitives: RewardPrimitives): Reward {
		return new Reward(
			primitives.id,
			primitives.tenantId,
			primitives.name,
			primitives.description,
			primitives.costPoints,
			primitives.type,
			primitives.isActive,
			primitives.stockLimit,
		);
	}

	toPrimitives(): RewardPrimitives {
		return {
			id: this.id,
			tenantId: this.tenantId,
			name: this.name,
			description: this.description,
			costPoints: this.costPoints,
			type: this.type,
			isActive: this.isActive,
			stockLimit: this.stockLimit,
		};
	}
}
