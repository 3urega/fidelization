import { InvalidStampCampaign } from "./InvalidStampCampaign";

export const STAMP_CAMPAIGN_VISUAL_TEMPLATES = [
	"coffee",
	"croissant",
	"burger",
	"pizza",
	"generic",
] as const;

export type StampCampaignVisualTemplate = (typeof STAMP_CAMPAIGN_VISUAL_TEMPLATES)[number];

export const STAMP_CAMPAIGN_CARD_BACKGROUNDS = [
	"coffee-photo",
	"coffee-sketch",
	"coffee-pattern",
	"coffee-minimal",
] as const;

export type StampCampaignCardBackgroundVariant =
	(typeof STAMP_CAMPAIGN_CARD_BACKGROUNDS)[number];

const VISUAL_TEMPLATE_SET = new Set<string>(STAMP_CAMPAIGN_VISUAL_TEMPLATES);
const CARD_BACKGROUND_SET = new Set<string>(STAMP_CAMPAIGN_CARD_BACKGROUNDS);

export function parseStampCampaignVisualTemplate(
	value: unknown,
): StampCampaignVisualTemplate {
	if (value === undefined || value === null || value === "") {
		return "generic";
	}

	if (typeof value === "string" && VISUAL_TEMPLATE_SET.has(value)) {
		return value as StampCampaignVisualTemplate;
	}

	throw new InvalidStampCampaign(`Invalid visualTemplate: ${String(value)}`);
}

export function parseStampCampaignCardBackgroundVariant(
	value: unknown,
): StampCampaignCardBackgroundVariant {
	if (value === undefined || value === null || value === "") {
		return "coffee-photo";
	}

	if (typeof value === "string" && CARD_BACKGROUND_SET.has(value)) {
		return value as StampCampaignCardBackgroundVariant;
	}

	throw new InvalidStampCampaign(`Invalid cardBackgroundVariant: ${String(value)}`);
}
