import type { PlatformBranding } from "../../contexts/platform/domain/PlatformBranding";
import type { GetPlatformSettingsResult } from "../../contexts/platform/application/settings/GetPlatformSettings";
import type { PlatformIntegrationStatus } from "../../contexts/platform/domain/PlatformIntegrationStatus";

export type PlatformBrandingResponse = {
	displayName: string;
	logoUrl: string;
};

export type PlatformIntegrationItemResponse = {
	key: string;
	label: string;
	configured: boolean;
	hint?: string;
};

export type PlatformIntegrationGroupResponse = {
	key: string;
	label: string;
	configured: boolean;
	items: PlatformIntegrationItemResponse[];
};

export type PlatformSettingsResponse = {
	branding: PlatformBrandingResponse;
	integrations: {
		groups: PlatformIntegrationGroupResponse[];
	};
};

export function platformBrandingToJson(branding: PlatformBranding): PlatformBrandingResponse {
	const primitives = branding.toPrimitives();

	return {
		displayName: primitives.displayName,
		logoUrl: primitives.logoUrl,
	};
}

export function platformIntegrationStatusToJson(
	integrations: PlatformIntegrationStatus,
): PlatformSettingsResponse["integrations"] {
	return {
		groups: integrations.groups.map((group) => ({
			key: group.key,
			label: group.label,
			configured: group.configured,
			items: group.items.map((item) => ({
				key: item.key,
				label: item.label,
				configured: item.configured,
				hint: item.hint,
			})),
		})),
	};
}

export function platformSettingsToJson(settings: GetPlatformSettingsResult): PlatformSettingsResponse {
	return {
		branding: platformBrandingToJson(settings.branding),
		integrations: platformIntegrationStatusToJson(settings.integrations),
	};
}
