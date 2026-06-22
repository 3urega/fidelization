import { Service } from "diod";

import { buildPlatformIntegrationStatus } from "../../../../lib/platform/integrationStatus";
import type { PlatformBranding } from "../../domain/PlatformBranding";
import type { PlatformIntegrationStatus } from "../../domain/PlatformIntegrationStatus";
import { PlatformSettingsRepository } from "../../domain/PlatformSettingsRepository";

export type GetPlatformSettingsResult = {
	branding: PlatformBranding;
	integrations: PlatformIntegrationStatus;
};

@Service()
export class GetPlatformSettings {
	constructor(private readonly repository: PlatformSettingsRepository) {}

	async execute(): Promise<GetPlatformSettingsResult> {
		const branding = await this.repository.getBranding();
		const integrations = buildPlatformIntegrationStatus();

		return { branding, integrations };
	}
}
