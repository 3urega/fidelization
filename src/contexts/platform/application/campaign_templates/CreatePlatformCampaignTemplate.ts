import { Service } from "diod";

import { InvalidPlatformCampaignTemplate } from "../../domain/InvalidPlatformCampaignTemplate";
import { PlatformCampaignTemplate } from "../../domain/PlatformCampaignTemplate";
import { parsePlatformCampaignTemplateCreate } from "../../domain/PlatformCampaignTemplateCreateInput";
import { PlatformCampaignTemplateRepository } from "../../domain/PlatformCampaignTemplateRepository";

export type CreatePlatformCampaignTemplateParams = {
	input: {
		name?: string;
		description?: string;
		requiredStamps?: number;
		suggestedStampTypeLabel?: string;
		visualTemplate?: unknown;
		cardBackgroundVariant?: unknown;
		conditions?: unknown;
		sortOrder?: number;
	};
};

@Service()
export class CreatePlatformCampaignTemplate {
	constructor(private readonly repository: PlatformCampaignTemplateRepository) {}

	async execute(params: CreatePlatformCampaignTemplateParams): Promise<PlatformCampaignTemplate> {
		const parsed = parsePlatformCampaignTemplateCreate(params.input);
		const sortOrder =
			params.input.sortOrder !== undefined
				? params.input.sortOrder
				: (await this.repository.maxSortOrder()) + 1;

		if (!Number.isInteger(sortOrder) || sortOrder < 0) {
			throw new InvalidPlatformCampaignTemplate("sortOrder must be a non-negative integer");
		}

		const template = PlatformCampaignTemplate.create({
			name: parsed.name,
			description: parsed.description,
			requiredStamps: parsed.requiredStamps,
			suggestedStampTypeLabel: parsed.suggestedStampTypeLabel,
			visualTemplate: parsed.visualTemplate,
			cardBackgroundVariant: parsed.cardBackgroundVariant,
			conditions: parsed.conditions,
			sortOrder,
		});

		await this.repository.save(template);

		return template;
	}
}
