import { Service } from "diod";

import { PlatformCampaignTemplate } from "../../domain/PlatformCampaignTemplate";
import { PlatformCampaignTemplateNotFound } from "../../domain/PlatformCampaignTemplateNotFound";
import { parsePlatformCampaignTemplatePartialUpdate } from "../../domain/PlatformCampaignTemplateUpdateInput";
import { PlatformCampaignTemplateRepository } from "../../domain/PlatformCampaignTemplateRepository";

export type UpdatePlatformCampaignTemplateParams = {
	templateId: string;
	input: {
		name?: string;
		description?: string;
		requiredStamps?: number;
		suggestedStampTypeLabel?: string;
		visualTemplate?: unknown;
		cardBackgroundVariant?: unknown;
		conditions?: unknown;
		isActive?: boolean;
		sortOrder?: number;
	};
};

@Service()
export class UpdatePlatformCampaignTemplate {
	constructor(private readonly repository: PlatformCampaignTemplateRepository) {}

	async execute(params: UpdatePlatformCampaignTemplateParams): Promise<PlatformCampaignTemplate> {
		const existing = await this.repository.searchById(params.templateId);

		if (!existing) {
			throw new PlatformCampaignTemplateNotFound(params.templateId);
		}

		const patch = parsePlatformCampaignTemplatePartialUpdate(params.input);
		const current = existing.toPrimitives();

		const updated = existing.update({
			name: patch.name ?? current.name,
			description: patch.description ?? current.description,
			requiredStamps: patch.requiredStamps ?? current.requiredStamps,
			suggestedStampTypeLabel:
				patch.suggestedStampTypeLabel ?? current.suggestedStampTypeLabel,
			visualTemplate: patch.visualTemplate ?? current.visualTemplate,
			cardBackgroundVariant: patch.cardBackgroundVariant ?? current.cardBackgroundVariant,
			conditions: patch.conditions ?? current.conditions,
			isActive: patch.isActive ?? current.isActive,
			sortOrder: patch.sortOrder ?? current.sortOrder,
		});

		await this.repository.save(updated);

		return updated;
	}
}
