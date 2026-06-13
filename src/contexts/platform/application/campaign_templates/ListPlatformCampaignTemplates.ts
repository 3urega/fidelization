import { Service } from "diod";

import type { PlatformCampaignTemplate } from "../../domain/PlatformCampaignTemplate";
import { PlatformCampaignTemplateRepository } from "../../domain/PlatformCampaignTemplateRepository";

export type ListPlatformCampaignTemplatesParams = {
	activeOnly?: boolean;
};

@Service()
export class ListPlatformCampaignTemplates {
	constructor(private readonly repository: PlatformCampaignTemplateRepository) {}

	async execute(
		params: ListPlatformCampaignTemplatesParams = {},
	): Promise<PlatformCampaignTemplate[]> {
		return this.repository.list({
			activeOnly: params.activeOnly ?? false,
		});
	}
}
