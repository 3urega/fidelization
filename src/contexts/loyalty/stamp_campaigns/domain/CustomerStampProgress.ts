import { randomUUID } from "crypto";

export type CustomerStampProgressPrimitives = {
	id: string;
	tenantId: string;
	customerId: string;
	campaignId: string;
	currentStamps: number;
	completed: boolean;
};

export type CustomerStampProgressStartParams = {
	tenantId: string;
	customerId: string;
	campaignId: string;
};

export type CustomerStampProgressAddStampResult = {
	progress: CustomerStampProgress;
	added: boolean;
};

export class CustomerStampProgress {
	private constructor(
		public readonly id: string,
		public readonly tenantId: string,
		public readonly customerId: string,
		public readonly campaignId: string,
		public readonly currentStamps: number,
		public readonly completed: boolean,
	) {}

	static start(params: CustomerStampProgressStartParams): CustomerStampProgress {
		return new CustomerStampProgress(
			randomUUID(),
			params.tenantId,
			params.customerId,
			params.campaignId,
			0,
			false,
		);
	}

	static fromPrimitives(primitives: CustomerStampProgressPrimitives): CustomerStampProgress {
		return new CustomerStampProgress(
			primitives.id,
			primitives.tenantId,
			primitives.customerId,
			primitives.campaignId,
			primitives.currentStamps,
			primitives.completed,
		);
	}

	addStamp(requiredStamps: number): CustomerStampProgressAddStampResult {
		if (this.completed) {
			return { progress: this, added: false };
		}

		const nextStamps = this.currentStamps + 1;
		const completed = nextStamps >= requiredStamps;

		return {
			added: true,
			progress: new CustomerStampProgress(
				this.id,
				this.tenantId,
				this.customerId,
				this.campaignId,
				nextStamps,
				completed,
			),
		};
	}

	toPrimitives(): CustomerStampProgressPrimitives {
		return {
			id: this.id,
			tenantId: this.tenantId,
			customerId: this.customerId,
			campaignId: this.campaignId,
			currentStamps: this.currentStamps,
			completed: this.completed,
		};
	}
}
