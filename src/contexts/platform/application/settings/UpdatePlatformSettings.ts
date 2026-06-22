import { Service } from "diod";

import {
	parsePlatformBrandingUpdate,
	type PlatformBrandingUpdateInput,
} from "../../domain/PlatformBrandingUpdate";
import type { PlatformBranding } from "../../domain/PlatformBranding";
import { PlatformSettingsRepository } from "../../domain/PlatformSettingsRepository";

export type UpdatePlatformSettingsParams = {
	branding: PlatformBrandingUpdateInput;
};

@Service()
export class UpdatePlatformSettings {
	constructor(private readonly repository: PlatformSettingsRepository) {}

	async execute(params: UpdatePlatformSettingsParams): Promise<PlatformBranding> {
		const current = await this.repository.getBranding();
		const branding = parsePlatformBrandingUpdate(current, params.branding);

		await this.repository.saveBranding(branding);

		return branding;
	}
}
