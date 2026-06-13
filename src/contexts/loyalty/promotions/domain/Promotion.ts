import { randomUUID } from "crypto";

export type PromotionType = "discount" | "bundle" | "seasonal";

export type PromotionPrimitives = {
	id: string;
	tenantId: string;
	title: string;
	description: string;
	type: PromotionType;
	startDate: string | null;
	endDate: string | null;
	isActive: boolean;
	maxUsesPerUser: number | null;
};

export type PromotionCreateParams = {
	tenantId: string;
	title: string;
	description: string;
	type: PromotionType;
	startDate: Date | null;
	endDate: Date | null;
	maxUsesPerUser?: number | null;
};

export class Promotion {
	private constructor(
		public readonly id: string,
		public readonly tenantId: string,
		public readonly title: string,
		public readonly description: string,
		public readonly type: PromotionType,
		public readonly startDate: Date | null,
		public readonly endDate: Date | null,
		public readonly isActive: boolean,
		public readonly maxUsesPerUser: number | null,
	) {}

	static create(params: PromotionCreateParams): Promotion {
		return new Promotion(
			randomUUID(),
			params.tenantId,
			params.title,
			params.description,
			params.type,
			params.startDate,
			params.endDate,
			true,
			params.maxUsesPerUser ?? null,
		);
	}

	static fromPrimitives(primitives: PromotionPrimitives): Promotion {
		return new Promotion(
			primitives.id,
			primitives.tenantId,
			primitives.title,
			primitives.description,
			primitives.type,
			primitives.startDate ? new Date(primitives.startDate) : null,
			primitives.endDate ? new Date(primitives.endDate) : null,
			primitives.isActive,
			primitives.maxUsesPerUser,
		);
	}

	deactivate(): Promotion {
		if (!this.isActive) {
			return this;
		}

		return new Promotion(
			this.id,
			this.tenantId,
			this.title,
			this.description,
			this.type,
			this.startDate,
			this.endDate,
			false,
			this.maxUsesPerUser,
		);
	}

	toPrimitives(): PromotionPrimitives {
		return {
			id: this.id,
			tenantId: this.tenantId,
			title: this.title,
			description: this.description,
			type: this.type,
			startDate: this.startDate?.toISOString() ?? null,
			endDate: this.endDate?.toISOString() ?? null,
			isActive: this.isActive,
			maxUsesPerUser: this.maxUsesPerUser,
		};
	}
}
