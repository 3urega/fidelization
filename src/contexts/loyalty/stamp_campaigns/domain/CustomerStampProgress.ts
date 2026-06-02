export type CustomerStampProgressPrimitives = {
	id: string;
	tenantId: string;
	customerId: string;
	campaignId: string;
	currentStamps: number;
	completed: boolean;
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
