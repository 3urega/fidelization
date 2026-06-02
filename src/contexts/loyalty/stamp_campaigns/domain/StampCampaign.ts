export type StampCampaignPrimitives = {
	id: string;
	tenantId: string;
	name: string;
	requiredStamps: number;
	rewardId: string | null;
	isActive: boolean;
};

export class StampCampaign {
	private constructor(
		public readonly id: string,
		public readonly tenantId: string,
		public readonly name: string,
		public readonly requiredStamps: number,
		public readonly rewardId: string | null,
		public readonly isActive: boolean,
	) {}

	static fromPrimitives(primitives: StampCampaignPrimitives): StampCampaign {
		return new StampCampaign(
			primitives.id,
			primitives.tenantId,
			primitives.name,
			primitives.requiredStamps,
			primitives.rewardId,
			primitives.isActive,
		);
	}

	toPrimitives(): StampCampaignPrimitives {
		return {
			id: this.id,
			tenantId: this.tenantId,
			name: this.name,
			requiredStamps: this.requiredStamps,
			rewardId: this.rewardId,
			isActive: this.isActive,
		};
	}
}
