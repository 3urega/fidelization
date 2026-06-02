export type CouponType = "percentage" | "fixed" | "free_item";

export type CouponPrimitives = {
	id: string;
	tenantId: string;
	code: string;
	type: CouponType;
	value: string;
	isActive: boolean;
};

export class Coupon {
	private constructor(
		public readonly id: string,
		public readonly tenantId: string,
		public readonly code: string,
		public readonly type: CouponType,
		public readonly value: string,
		public readonly isActive: boolean,
	) {}

	static fromPrimitives(primitives: CouponPrimitives): Coupon {
		return new Coupon(
			primitives.id,
			primitives.tenantId,
			primitives.code,
			primitives.type,
			primitives.value,
			primitives.isActive,
		);
	}

	toPrimitives(): CouponPrimitives {
		return {
			id: this.id,
			tenantId: this.tenantId,
			code: this.code,
			type: this.type,
			value: this.value,
			isActive: this.isActive,
		};
	}
}
