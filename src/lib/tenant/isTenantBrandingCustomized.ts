export const DEFAULT_TENANT_PRIMARY_COLOR = "#7C3AED";
export const DEFAULT_TENANT_SECONDARY_COLOR = "#4F46E5";

export type TenantBrandingFields = {
	logoUrl: string;
	primaryColor: string;
	secondaryColor: string;
};

export function isTenantBrandingCustomized(tenant: TenantBrandingFields): boolean {
	return (
		tenant.logoUrl.trim() !== "" ||
		tenant.primaryColor !== DEFAULT_TENANT_PRIMARY_COLOR ||
		tenant.secondaryColor !== DEFAULT_TENANT_SECONDARY_COLOR
	);
}
