import {
	parseStampCampaignCardBackgroundVariant,
	parseStampCampaignVisualTemplate,
} from "../../loyalty/stamp_campaigns/domain/StampCampaignVisualAssets";
import { InvalidPlatformCampaignTemplate } from "./InvalidPlatformCampaignTemplate";
import type { PlatformCampaignTemplateCreateInput } from "./PlatformCampaignTemplateCreateInput";
import { parsePlatformCampaignTemplateCreate } from "./PlatformCampaignTemplateCreateInput";

export type PlatformCampaignTemplateUpdateInput = PlatformCampaignTemplateCreateInput & {
	isActive: boolean;
	sortOrder: number;
};

export function parsePlatformCampaignTemplateUpdate(input: {
	name?: string;
	description?: string;
	requiredStamps?: number;
	suggestedStampTypeLabel?: string;
	visualTemplate?: unknown;
	cardBackgroundVariant?: unknown;
	conditions?: unknown;
	isActive?: boolean;
	sortOrder?: number;
}): PlatformCampaignTemplateUpdateInput {
	const base = parsePlatformCampaignTemplateCreate(input);

	if (input.isActive !== undefined && typeof input.isActive !== "boolean") {
		throw new InvalidPlatformCampaignTemplate("isActive must be a boolean");
	}

	const sortOrder = input.sortOrder;

	if (sortOrder !== undefined && (!Number.isInteger(sortOrder) || sortOrder < 0)) {
		throw new InvalidPlatformCampaignTemplate("sortOrder must be a non-negative integer");
	}

	return {
		...base,
		isActive: input.isActive ?? true,
		sortOrder: sortOrder ?? 0,
	};
}

export function parsePlatformCampaignTemplatePartialUpdate(input: {
	name?: string;
	description?: string;
	requiredStamps?: number;
	suggestedStampTypeLabel?: string;
	visualTemplate?: unknown;
	cardBackgroundVariant?: unknown;
	conditions?: unknown;
	isActive?: boolean;
	sortOrder?: number;
}): Partial<PlatformCampaignTemplateUpdateInput> {
	const partial: Partial<PlatformCampaignTemplateUpdateInput> = {};

	if (input.name !== undefined) {
		const name = input.name.trim();
		if (!name) {
			throw new InvalidPlatformCampaignTemplate("Template name is required");
		}
		partial.name = name;
	}

	if (input.description !== undefined) {
		partial.description = String(input.description).trim();
	}

	if (input.requiredStamps !== undefined) {
		if (!Number.isInteger(input.requiredStamps) || input.requiredStamps < 1) {
			throw new InvalidPlatformCampaignTemplate(
				"requiredStamps must be an integer greater than or equal to 1",
			);
		}
		partial.requiredStamps = input.requiredStamps;
	}

	if (input.suggestedStampTypeLabel !== undefined) {
		partial.suggestedStampTypeLabel = String(input.suggestedStampTypeLabel).trim();
	}

	if (input.visualTemplate !== undefined) {
		try {
			partial.visualTemplate = parseStampCampaignVisualTemplate(input.visualTemplate);
		} catch {
			throw new InvalidPlatformCampaignTemplate(
				`Invalid visualTemplate: ${String(input.visualTemplate)}`,
			);
		}
	}

	if (input.cardBackgroundVariant !== undefined) {
		try {
			partial.cardBackgroundVariant = parseStampCampaignCardBackgroundVariant(
				input.cardBackgroundVariant,
			);
		} catch {
			throw new InvalidPlatformCampaignTemplate(
				`Invalid cardBackgroundVariant: ${String(input.cardBackgroundVariant)}`,
			);
		}
	}

	if (input.conditions !== undefined) {
		partial.conditions = String(input.conditions).trim();
	}

	if (input.isActive !== undefined) {
		if (typeof input.isActive !== "boolean") {
			throw new InvalidPlatformCampaignTemplate("isActive must be a boolean");
		}
		partial.isActive = input.isActive;
	}

	if (input.sortOrder !== undefined) {
		if (!Number.isInteger(input.sortOrder) || input.sortOrder < 0) {
			throw new InvalidPlatformCampaignTemplate("sortOrder must be a non-negative integer");
		}
		partial.sortOrder = input.sortOrder;
	}

	return partial;
}
