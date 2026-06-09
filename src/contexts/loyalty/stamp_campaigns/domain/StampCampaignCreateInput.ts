import { InvalidStampCampaign } from "./InvalidStampCampaign";

const MAX_NAME_LENGTH = 120;

export type StampCampaignCreateInput = {
	name: string;
	requiredStamps: number;
};

export function parseStampCampaignCreate(input: {
	name?: string;
	requiredStamps?: number;
}): StampCampaignCreateInput {
	const name = input.name?.trim() ?? "";

	if (!name) {
		throw new InvalidStampCampaign("Campaign name is required");
	}

	if (name.length > MAX_NAME_LENGTH) {
		throw new InvalidStampCampaign(`Campaign name must be at most ${MAX_NAME_LENGTH} characters`);
	}

	const requiredStamps = input.requiredStamps;

	if (requiredStamps === undefined || requiredStamps === null) {
		throw new InvalidStampCampaign("requiredStamps is required");
	}

	if (!Number.isInteger(requiredStamps) || requiredStamps < 1) {
		throw new InvalidStampCampaign("requiredStamps must be an integer greater than or equal to 1");
	}

	return { name, requiredStamps };
}
