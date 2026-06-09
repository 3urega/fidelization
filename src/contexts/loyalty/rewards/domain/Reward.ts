import { randomUUID } from "crypto";

import { RewardType } from "./Reward";

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

export type RewardCreateParams = {
	tenantId: string;
	name: string;
	description: string;
	costPoints: number;
	type: RewardType;
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

	static create(params: RewardCreateParams): Reward {
		return new Reward(
			randomUUID(),
			params.tenantId,
			params.name,
			params.description,
			params.costPoints,
			params.type,
			true,
			null,
		);
	}

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

	deactivate(): Reward {
		if (!this.isActive) {
			return this;
		}

		return new Reward(
			this.id,
			this.tenantId,
			this.name,
			this.description,
			this.costPoints,
			this.type,
			false,
			this.stockLimit,
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
