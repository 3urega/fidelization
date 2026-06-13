import { Service } from "diod";

import { TenantRole } from "../../../../tenants/memberships/domain/TenantRole";
import { PlatformCampaignTemplateNotFound } from "../../../../platform/domain/PlatformCampaignTemplateNotFound";
import { PlatformCampaignTemplateRepository } from "../../../../platform/domain/PlatformCampaignTemplateRepository";
import { StampCampaign } from "../../domain/StampCampaign";
import { CreateStampCampaign } from "../create/CreateStampCampaign";

export type CreateStampCampaignFromPlatformTemplateParams = {
	tenantId: string;
	role: TenantRole;
	templateId: string;
	stampTypeId: string;
};

@Service()
export class CreateStampCampaignFromPlatformTemplate {
	constructor(
		private readonly templateRepository: PlatformCampaignTemplateRepository,
		private readonly createStampCampaign: CreateStampCampaign,
	) {}

	async execute(params: CreateStampCampaignFromPlatformTemplateParams): Promise<StampCampaign> {
		const template = await this.templateRepository.searchById(params.templateId);

		if (!template || !template.toPrimitives().isActive) {
			throw new PlatformCampaignTemplateNotFound(params.templateId);
		}

		const source = template.toPrimitives();

		return this.createStampCampaign.execute({
			tenantId: params.tenantId,
			role: params.role,
			input: {
				name: source.name,
				requiredStamps: source.requiredStamps,
				stampTypeId: params.stampTypeId,
				visualTemplate: source.visualTemplate,
				cardBackgroundVariant: source.cardBackgroundVariant,
				conditions: source.conditions,
			},
		});
	}
}
