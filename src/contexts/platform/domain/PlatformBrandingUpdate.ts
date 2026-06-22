import { PlatformBranding } from "./PlatformBranding";
import { InvalidPlatformBranding } from "./InvalidPlatformBranding";

const MAX_DISPLAY_NAME_LENGTH = 80;
const MAX_LOGO_URL_LENGTH = 500;

export type PlatformBrandingUpdateInput = {
	displayName?: string;
	logoUrl?: string;
};

function parseLogoUrl(value: string): string {
	const trimmed = value.trim();

	if (trimmed.length === 0) {
		return "";
	}

	if (trimmed.length > MAX_LOGO_URL_LENGTH) {
		throw new InvalidPlatformBranding(`logoUrl must be at most ${MAX_LOGO_URL_LENGTH} characters`);
	}

	let parsed: URL;

	try {
		parsed = new URL(trimmed);
	} catch {
		throw new InvalidPlatformBranding("logoUrl must be a valid http or https URL");
	}

	if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
		throw new InvalidPlatformBranding("logoUrl must use http or https");
	}

	return trimmed;
}

function parseDisplayName(value: string): string {
	const trimmed = value.trim();

	if (trimmed.length === 0) {
		throw new InvalidPlatformBranding("displayName is required");
	}

	if (trimmed.length > MAX_DISPLAY_NAME_LENGTH) {
		throw new InvalidPlatformBranding(
			`displayName must be at most ${MAX_DISPLAY_NAME_LENGTH} characters`,
		);
	}

	return trimmed;
}

export function parsePlatformBrandingUpdate(
	current: PlatformBranding,
	input: PlatformBrandingUpdateInput,
): PlatformBranding {
	const currentPrimitives = current.toPrimitives();

	if (input.displayName === undefined && input.logoUrl === undefined) {
		throw new InvalidPlatformBranding("At least one branding field is required");
	}

	return PlatformBranding.fromPrimitives({
		displayName:
			input.displayName === undefined
				? currentPrimitives.displayName
				: parseDisplayName(String(input.displayName)),
		logoUrl:
			input.logoUrl === undefined ? currentPrimitives.logoUrl : parseLogoUrl(String(input.logoUrl)),
	});
}
