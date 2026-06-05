import { InvalidTenantBranding } from "./InvalidTenantBranding";

const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

export function isBrandingHexColor(value: string): boolean {
	return HEX_COLOR_PATTERN.test(value.trim());
}

export function parseBrandingHexColor(value: string, fieldName: string): string {
	const trimmed = value.trim();

	if (!isBrandingHexColor(trimmed)) {
		throw new InvalidTenantBranding(`Invalid ${fieldName}: expected #RRGGBB hex color`);
	}

	return trimmed;
}
