export type PromotionType = "discount" | "bundle" | "seasonal";

export type PromotionPrimitives = {
	id: string;
	tenantId: string;
	title: string;
	description: string;
	type: PromotionType;
	isActive: boolean;
};

export class Promotion {
	private constructor(
		public readonly id: string,
		public readonly tenantId: string,
		public readonly title: string,
		public readonly description: string,
		public readonly type: PromotionType,
		public readonly isActive: boolean,
	) {}

	static fromPrimitives(primitives: PromotionPrimitives): Promotion {
		return new Promotion(
			primitives.id,
			primitives.tenantId,
			primitives.title,
			primitives.description,
			primitives.type,
			primitives.isActive,
		);
	}

	toPrimitives(): PromotionPrimitives {
		return {
			id: this.id,
			tenantId: this.tenantId,
			title: this.title,
			description: this.description,
			type: this.type,
			isActive: this.isActive,
		};
	}
}
