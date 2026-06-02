export type CustomerPrimitives = {
	id: string;
	tenantId: string;
	name: string;
	email: string | null;
	phone: string | null;
	qrValue: string;
	pointsBalance: number;
	visitsCount: number;
};

export class Customer {
	private constructor(
		public readonly id: string,
		public readonly tenantId: string,
		public readonly name: string,
		public readonly email: string | null,
		public readonly phone: string | null,
		public readonly qrValue: string,
		public readonly pointsBalance: number,
		public readonly visitsCount: number,
	) {}

	static fromPrimitives(primitives: CustomerPrimitives): Customer {
		return new Customer(
			primitives.id,
			primitives.tenantId,
			primitives.name,
			primitives.email,
			primitives.phone,
			primitives.qrValue,
			primitives.pointsBalance,
			primitives.visitsCount,
		);
	}

	toPrimitives(): CustomerPrimitives {
		return {
			id: this.id,
			tenantId: this.tenantId,
			name: this.name,
			email: this.email,
			phone: this.phone,
			qrValue: this.qrValue,
			pointsBalance: this.pointsBalance,
			visitsCount: this.visitsCount,
		};
	}
}
