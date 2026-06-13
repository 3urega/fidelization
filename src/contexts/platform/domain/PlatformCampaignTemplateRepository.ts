import type { PlatformCampaignTemplate } from "./PlatformCampaignTemplate";

export type ListPlatformCampaignTemplatesParams = {
	activeOnly?: boolean;
};

export abstract class PlatformCampaignTemplateRepository {
	abstract list(params: ListPlatformCampaignTemplatesParams): Promise<PlatformCampaignTemplate[]>;

	abstract searchById(id: string): Promise<PlatformCampaignTemplate | null>;

	abstract save(template: PlatformCampaignTemplate): Promise<void>;

	abstract maxSortOrder(): Promise<number>;
}
