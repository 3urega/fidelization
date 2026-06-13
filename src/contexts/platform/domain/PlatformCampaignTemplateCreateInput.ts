import {
	parseStampCampaignCardBackgroundVariant,
	parseStampCampaignVisualTemplate,
} from "../../loyalty/stamp_campaigns/domain/StampCampaignVisualAssets";
import { InvalidPlatformCampaignTemplate } from "./InvalidPlatformCampaignTemplate";

const MAX_NAME_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 500;
const MAX_LABEL_LENGTH = 80;
const MAX_CONDITIONS_LENGTH = 500;

export type PlatformCampaignTemplateCreateInput = {
	name: string;
	description: string;
	requiredStamps: number;
	suggestedStampTypeLabel: string;
	visualTemplate: ReturnType<typeof parseStampCampaignVisualTemplate>;
	cardBackgroundVariant: ReturnType<typeof parseStampCampaignCardBackgroundVariant>;
	conditions: string;
};

function parseOptionalText(
	value: unknown,
	field: string,
	maxLength: number,
): string {
	if (value === undefined || value === null) {
		return "";
	}

	const text = String(value).trim();

	if (text.length > maxLength) {
		throw new InvalidPlatformCampaignTemplate(`${field} must be at most ${maxLength} characters`);
	}

	return text;
}

function parseVisualTemplate(value: unknown) {
	try {
		return parseStampCampaignVisualTemplate(value);
	} catch {
		throw new InvalidPlatformCampaignTemplate(`Invalid visualTemplate: ${String(value)}`);
	}
}

function parseCardBackground(value: unknown) {
	try {
		return parseStampCampaignCardBackgroundVariant(value);
	} catch {
		throw new InvalidPlatformCampaignTemplate(
			`Invalid cardBackgroundVariant: ${String(value)}`,
		);
	}
}

export function parsePlatformCampaignTemplateCreate(input: {
	name?: string;
	description?: string;
	requiredStamps?: number;
	suggestedStampTypeLabel?: string;
	visualTemplate?: unknown;
	cardBackgroundVariant?: unknown;
	conditions?: unknown;
}): PlatformCampaignTemplateCreateInput {
	const name = input.name?.trim() ?? "";

	if (!name) {
		throw new InvalidPlatformCampaignTemplate("Template name is required");
	}

	if (name.length > MAX_NAME_LENGTH) {
		throw new InvalidPlatformCampaignTemplate(
			`Template name must be at most ${MAX_NAME_LENGTH} characters`,
		);
	}

	const requiredStamps = input.requiredStamps;

	if (requiredStamps === undefined || requiredStamps === null) {
		throw new InvalidPlatformCampaignTemplate("requiredStamps is required");
	}

	if (!Number.isInteger(requiredStamps) || requiredStamps < 1) {
		throw new InvalidPlatformCampaignTemplate(
			"requiredStamps must be an integer greater than or equal to 1",
		);
	}

	return {
		name,
		description: parseOptionalText(input.description, "description", MAX_DESCRIPTION_LENGTH),
		requiredStamps,
		suggestedStampTypeLabel: parseOptionalText(
			input.suggestedStampTypeLabel,
			"suggestedStampTypeLabel",
			MAX_LABEL_LENGTH,
		),
		visualTemplate: parseVisualTemplate(input.visualTemplate),
		cardBackgroundVariant: parseCardBackground(input.cardBackgroundVariant),
		conditions: parseOptionalText(input.conditions, "conditions", MAX_CONDITIONS_LENGTH),
	};
}
