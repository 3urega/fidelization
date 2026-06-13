import { InvalidStampCampaign } from "./InvalidStampCampaign";
import {
	parseStampCampaignCardBackgroundVariant,
	parseStampCampaignVisualTemplate,
} from "./StampCampaignVisualAssets";

const MAX_NAME_LENGTH = 120;
const MAX_CONDITIONS_LENGTH = 500;

export type StampCampaignCreateInput = {
	name: string;
	requiredStamps: number;
	stampTypeId: string;
	visualTemplate: ReturnType<typeof parseStampCampaignVisualTemplate>;
	cardBackgroundVariant: ReturnType<typeof parseStampCampaignCardBackgroundVariant>;
	conditions: string;
};

function parseOptionalConditions(value: unknown): string {
	if (value === undefined || value === null) {
		return "";
	}

	const conditions = String(value).trim();

	if (conditions.length > MAX_CONDITIONS_LENGTH) {
		throw new InvalidStampCampaign(
			`conditions must be at most ${MAX_CONDITIONS_LENGTH} characters`,
		);
	}

	return conditions;
}

export function parseStampCampaignCreate(input: {
	name?: string;
	requiredStamps?: number;
	stampTypeId?: string | null;
	visualTemplate?: unknown;
	cardBackgroundVariant?: unknown;
	conditions?: unknown;
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

	let stampTypeId: string;

	if (input.stampTypeId === undefined || input.stampTypeId === null) {
		throw new InvalidStampCampaign("stampTypeId is required");
	}

	const trimmedTypeId = String(input.stampTypeId).trim();

	if (!trimmedTypeId) {
		throw new InvalidStampCampaign("stampTypeId is required");
	}

	stampTypeId = trimmedTypeId;

	return {
		name,
		requiredStamps,
		stampTypeId,
		visualTemplate: parseStampCampaignVisualTemplate(input.visualTemplate),
		cardBackgroundVariant: parseStampCampaignCardBackgroundVariant(input.cardBackgroundVariant),
		conditions: parseOptionalConditions(input.conditions),
	};
}
