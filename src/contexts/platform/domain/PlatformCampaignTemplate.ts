import { randomUUID } from "crypto";

import type { StampCampaignCardBackgroundVariant } from "../../loyalty/stamp_campaigns/domain/StampCampaignVisualAssets";
import type { StampCampaignVisualTemplate } from "../../loyalty/stamp_campaigns/domain/StampCampaignVisualAssets";

export type PlatformCampaignTemplatePrimitives = {
	id: string;
	name: string;
	description: string;
	requiredStamps: number;
	suggestedStampTypeLabel: string;
	visualTemplate: StampCampaignVisualTemplate;
	cardBackgroundVariant: StampCampaignCardBackgroundVariant;
	conditions: string;
	isActive: boolean;
	sortOrder: number;
};

export type PlatformCampaignTemplateCreateParams = {
	name: string;
	description: string;
	requiredStamps: number;
	suggestedStampTypeLabel: string;
	visualTemplate: StampCampaignVisualTemplate;
	cardBackgroundVariant: StampCampaignCardBackgroundVariant;
	conditions: string;
	sortOrder: number;
};

export class PlatformCampaignTemplate {
	private constructor(
		public readonly id: string,
		public readonly name: string,
		public readonly description: string,
		public readonly requiredStamps: number,
		public readonly suggestedStampTypeLabel: string,
		public readonly visualTemplate: StampCampaignVisualTemplate,
		public readonly cardBackgroundVariant: StampCampaignCardBackgroundVariant,
		public readonly conditions: string,
		public readonly isActive: boolean,
		public readonly sortOrder: number,
	) {}

	static create(params: PlatformCampaignTemplateCreateParams): PlatformCampaignTemplate {
		return new PlatformCampaignTemplate(
			randomUUID(),
			params.name,
			params.description,
			params.requiredStamps,
			params.suggestedStampTypeLabel,
			params.visualTemplate,
			params.cardBackgroundVariant,
			params.conditions,
			true,
			params.sortOrder,
		);
	}

	static fromPrimitives(primitives: PlatformCampaignTemplatePrimitives): PlatformCampaignTemplate {
		return new PlatformCampaignTemplate(
			primitives.id,
			primitives.name,
			primitives.description,
			primitives.requiredStamps,
			primitives.suggestedStampTypeLabel,
			primitives.visualTemplate,
			primitives.cardBackgroundVariant,
			primitives.conditions,
			primitives.isActive,
			primitives.sortOrder,
		);
	}

	toPrimitives(): PlatformCampaignTemplatePrimitives {
		return {
			id: this.id,
			name: this.name,
			description: this.description,
			requiredStamps: this.requiredStamps,
			suggestedStampTypeLabel: this.suggestedStampTypeLabel,
			visualTemplate: this.visualTemplate,
			cardBackgroundVariant: this.cardBackgroundVariant,
			conditions: this.conditions,
			isActive: this.isActive,
			sortOrder: this.sortOrder,
		};
	}

	update(params: {
		name: string;
		description: string;
		requiredStamps: number;
		suggestedStampTypeLabel: string;
		visualTemplate: StampCampaignVisualTemplate;
		cardBackgroundVariant: StampCampaignCardBackgroundVariant;
		conditions: string;
		isActive: boolean;
		sortOrder: number;
	}): PlatformCampaignTemplate {
		return new PlatformCampaignTemplate(
			this.id,
			params.name,
			params.description,
			params.requiredStamps,
			params.suggestedStampTypeLabel,
			params.visualTemplate,
			params.cardBackgroundVariant,
			params.conditions,
			params.isActive,
			params.sortOrder,
		);
	}
}
