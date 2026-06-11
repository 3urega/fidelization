import { InvalidStampCampaign } from "./InvalidStampCampaign";

const MAX_NAME_LENGTH = 120;

export type StampCampaignCreateInput = {
	name: string;
	requiredStamps: number;
	stampTypeId: string | null;
};

export function parseStampCampaignCreate(input: {
	name?: string;
	requiredStamps?: number;
	stampTypeId?: string | null;
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

	let stampTypeId: string | null = null;

	if (input.stampTypeId !== undefined && input.stampTypeId !== null) {
		const trimmed = String(input.stampTypeId).trim();

		if (!trimmed) {
			throw new InvalidStampCampaign("stampTypeId must be a non-empty id or null");
		}

		stampTypeId = trimmed;
	}

	return { name, requiredStamps, stampTypeId };
}
