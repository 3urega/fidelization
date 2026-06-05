import { parseBrandingHexColor } from "./BrandingColor";
import { InvalidTenantBranding } from "./InvalidTenantBranding";

export type TenantBrandingUpdate = {
	logoUrl?: string;
	primaryColor?: string;
	secondaryColor?: string;
};

export type TenantBrandingUpdateInput = {
	logoUrl?: string;
	primaryColor?: string;
	secondaryColor?: string;
};

export function parseTenantBrandingUpdate(input: TenantBrandingUpdateInput): TenantBrandingUpdate {
	const branding: TenantBrandingUpdate = {};

	if (input.logoUrl !== undefined) {
		branding.logoUrl = input.logoUrl.trim();
	}

	if (input.primaryColor !== undefined) {
		branding.primaryColor = parseBrandingHexColor(input.primaryColor, "primaryColor");
	}

	if (input.secondaryColor !== undefined) {
		branding.secondaryColor = parseBrandingHexColor(input.secondaryColor, "secondaryColor");
	}

	if (Object.keys(branding).length === 0) {
		throw new InvalidTenantBranding("At least one branding field is required");
	}

	return branding;
}
