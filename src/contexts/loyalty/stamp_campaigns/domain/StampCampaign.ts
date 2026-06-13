import { randomUUID } from "crypto";

import {
	type StampCampaignCardBackgroundVariant,
	type StampCampaignVisualTemplate,
} from "./StampCampaignVisualAssets";

export type StampCampaignPrimitives = {
	id: string;
	tenantId: string;
	name: string;
	requiredStamps: number;
	rewardId: string | null;
	stampTypeId: string | null;
	visualTemplate: StampCampaignVisualTemplate;
	cardBackgroundVariant: StampCampaignCardBackgroundVariant;
	conditions: string;
	isActive: boolean;
	createdAt?: Date | null;
};

export type StampCampaignCreateParams = {
	tenantId: string;
	name: string;
	requiredStamps: number;
	stampTypeId?: string | null;
	visualTemplate?: StampCampaignVisualTemplate;
	cardBackgroundVariant?: StampCampaignCardBackgroundVariant;
	conditions?: string;
};

export class StampCampaign {
	private constructor(
		public readonly id: string,
		public readonly tenantId: string,
		public readonly name: string,
		public readonly requiredStamps: number,
		public readonly rewardId: string | null,
		public readonly stampTypeId: string | null,
		public readonly visualTemplate: StampCampaignVisualTemplate,
		public readonly cardBackgroundVariant: StampCampaignCardBackgroundVariant,
		public readonly conditions: string,
		public readonly isActive: boolean,
		public readonly createdAt: Date | null,
	) {}

	static create(params: StampCampaignCreateParams): StampCampaign {
		return new StampCampaign(
			randomUUID(),
			params.tenantId,
			params.name,
			params.requiredStamps,
			null,
			params.stampTypeId ?? null,
			params.visualTemplate ?? "generic",
			params.cardBackgroundVariant ?? "coffee-photo",
			params.conditions?.trim() ?? "",
			true,
			null,
		);
	}

	static fromPrimitives(primitives: StampCampaignPrimitives): StampCampaign {
		return new StampCampaign(
			primitives.id,
			primitives.tenantId,
			primitives.name,
			primitives.requiredStamps,
			primitives.rewardId,
			primitives.stampTypeId,
			primitives.visualTemplate,
			primitives.cardBackgroundVariant,
			primitives.conditions ?? "",
			primitives.isActive,
			primitives.createdAt ?? null,
		);
	}

	toPrimitives(): StampCampaignPrimitives {
		return {
			id: this.id,
			tenantId: this.tenantId,
			name: this.name,
			requiredStamps: this.requiredStamps,
			rewardId: this.rewardId,
			stampTypeId: this.stampTypeId,
			visualTemplate: this.visualTemplate,
			cardBackgroundVariant: this.cardBackgroundVariant,
			conditions: this.conditions,
			isActive: this.isActive,
			createdAt: this.createdAt,
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
			this.stampTypeId,
			this.visualTemplate,
			this.cardBackgroundVariant,
			this.conditions,
			false,
			this.createdAt,
		);
	}
}
