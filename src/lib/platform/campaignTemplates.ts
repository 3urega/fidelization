import type { PlatformCampaignTemplate } from "../../contexts/platform/domain/PlatformCampaignTemplate";

export type PlatformCampaignTemplateResponse = {
	id: string;
	name: string;
	description: string;
	requiredStamps: number;
	suggestedStampTypeLabel: string;
	visualTemplate: string;
	cardBackgroundVariant: string;
	conditions: string;
	isActive: boolean;
	sortOrder: number;
};

export function platformCampaignTemplateToJson(
	template: PlatformCampaignTemplate,
): PlatformCampaignTemplateResponse {
	const primitives = template.toPrimitives();

	return {
		id: primitives.id,
		name: primitives.name,
		description: primitives.description,
		requiredStamps: primitives.requiredStamps,
		suggestedStampTypeLabel: primitives.suggestedStampTypeLabel,
		visualTemplate: primitives.visualTemplate,
		cardBackgroundVariant: primitives.cardBackgroundVariant,
		conditions: primitives.conditions,
		isActive: primitives.isActive,
		sortOrder: primitives.sortOrder,
	};
}

export function platformCampaignTemplatesToJson(
	templates: PlatformCampaignTemplate[],
): { templates: PlatformCampaignTemplateResponse[] } {
	return {
		templates: templates.map((template) => platformCampaignTemplateToJson(template)),
	};
}
