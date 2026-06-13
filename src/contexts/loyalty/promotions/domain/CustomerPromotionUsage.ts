import { randomUUID } from "crypto";

export type CustomerPromotionUsagePrimitives = {
	id: string;
	tenantId: string;
	customerId: string;
	promotionId: string;
	usedCount: number;
};

export type CustomerPromotionUsageStartParams = {
	tenantId: string;
	customerId: string;
	promotionId: string;
};

export class CustomerPromotionUsage {
	private constructor(
		public readonly id: string,
		public readonly tenantId: string,
		public readonly customerId: string,
		public readonly promotionId: string,
		public readonly usedCount: number,
	) {}

	static start(params: CustomerPromotionUsageStartParams): CustomerPromotionUsage {
		return new CustomerPromotionUsage(
			randomUUID(),
			params.tenantId,
			params.customerId,
			params.promotionId,
			0,
		);
	}

	static fromPrimitives(primitives: CustomerPromotionUsagePrimitives): CustomerPromotionUsage {
		return new CustomerPromotionUsage(
			primitives.id,
			primitives.tenantId,
			primitives.customerId,
			primitives.promotionId,
			primitives.usedCount,
		);
	}

	increment(): CustomerPromotionUsage {
		return new CustomerPromotionUsage(
			this.id,
			this.tenantId,
			this.customerId,
			this.promotionId,
			this.usedCount + 1,
		);
	}

	toPrimitives(): CustomerPromotionUsagePrimitives {
		return {
			id: this.id,
			tenantId: this.tenantId,
			customerId: this.customerId,
			promotionId: this.promotionId,
			usedCount: this.usedCount,
		};
	}
}
