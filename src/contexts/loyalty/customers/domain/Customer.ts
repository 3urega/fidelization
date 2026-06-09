import { randomUUID } from "crypto";

import { InsufficientCustomerPoints } from "./InsufficientCustomerPoints";

export type CustomerPrimitives = {
	id: string;
	tenantId: string;
	userId: string | null;
	name: string;
	email: string | null;
	phone: string | null;
	qrValue: string;
	pointsBalance: number;
	visitsCount: number;
};

export type RegisterCustomerParams = {
	tenantId: string;
	name: string;
	email?: string | null;
	phone?: string | null;
};

export class Customer {
	private constructor(
		public readonly id: string,
		public readonly tenantId: string,
		public readonly userId: string | null,
		public readonly name: string,
		public readonly email: string | null,
		public readonly phone: string | null,
		public readonly qrValue: string,
		public readonly pointsBalance: number,
		public readonly visitsCount: number,
	) {}

	static register(params: RegisterCustomerParams): Customer {
		const name = params.name.trim();
		const email = params.email?.trim() ?? "";
		const phone = params.phone?.trim() ?? "";

		return Customer.fromPrimitives({
			id: randomUUID(),
			tenantId: params.tenantId,
			userId: null,
			name,
			email: email === "" ? null : email,
			phone: phone === "" ? null : phone,
			qrValue: randomUUID(),
			pointsBalance: 0,
			visitsCount: 0,
		});
	}

	static fromPrimitives(primitives: CustomerPrimitives): Customer {
		return new Customer(
			primitives.id,
			primitives.tenantId,
			primitives.userId,
			primitives.name,
			primitives.email,
			primitives.phone,
			primitives.qrValue,
			primitives.pointsBalance,
			primitives.visitsCount,
		);
	}

	recordVisit(pointsEarned: number): Customer {
		if (!Number.isInteger(pointsEarned) || pointsEarned <= 0) {
			throw new Error("pointsEarned must be a positive integer");
		}

		return Customer.fromPrimitives({
			...this.toPrimitives(),
			pointsBalance: this.pointsBalance + pointsEarned,
			visitsCount: this.visitsCount + 1,
		});
	}

	redeemPoints(costPoints: number): Customer {
		if (!Number.isInteger(costPoints) || costPoints <= 0) {
			throw new Error("costPoints must be a positive integer");
		}

		if (costPoints > this.pointsBalance) {
			throw new InsufficientCustomerPoints(costPoints, this.pointsBalance);
		}

		return Customer.fromPrimitives({
			...this.toPrimitives(),
			pointsBalance: this.pointsBalance - costPoints,
		});
	}

	toPrimitives(): CustomerPrimitives {
		return {
			id: this.id,
			tenantId: this.tenantId,
			userId: this.userId,
			name: this.name,
			email: this.email,
			phone: this.phone,
			qrValue: this.qrValue,
			pointsBalance: this.pointsBalance,
			visitsCount: this.visitsCount,
		};
	}
}
