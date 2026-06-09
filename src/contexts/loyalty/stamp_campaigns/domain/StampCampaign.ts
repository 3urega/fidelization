import { randomUUID } from "crypto";

export type StampCampaignPrimitives = {
	id: string;
	tenantId: string;
	name: string;
	requiredStamps: number;
	rewardId: string | null;
	isActive: boolean;
};

export type StampCampaignCreateParams = {
	tenantId: string;
	name: string;
	requiredStamps: number;
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

	static create(params: StampCampaignCreateParams): StampCampaign {
		return new StampCampaign(
			randomUUID(),
			params.tenantId,
			params.name,
			params.requiredStamps,
			null,
			true,
		);
	}

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

	deactivate(): StampCampaign {
		if (!this.isActive) {
			return this;
		}

		return new StampCampaign(
			this.id,
			this.tenantId,
			this.name,
			this.requiredStamps,
			this.rewardId,
			false,
		);
	}
}
