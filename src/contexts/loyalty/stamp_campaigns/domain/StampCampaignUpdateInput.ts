import { InvalidStampCampaign } from "./InvalidStampCampaign";

export function parseStampCampaignDeactivate(input: { isActive?: boolean }): { isActive: false } {
	if (input.isActive !== false) {
		throw new InvalidStampCampaign("Only deactivation is supported (isActive: false)");
	}

	return { isActive: false };
}
