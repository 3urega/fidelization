import type { ReactElement } from "react";

import { getResolvedTenantFromHeaders } from "../../../lib/tenant/getResolvedTenant";
import { getTenantBrandingBySlug } from "../../../lib/tenant/mockTenantBySlug";
import { HostTenantThemeApplier } from "./HostTenantThemeApplier";

/** Server wrapper: apply branding when middleware resolved a tenant from subdomain. */
export function ResolvedHostTenantTheme(): ReactElement | null {
	const tenant = getResolvedTenantFromHeaders();
	if (!tenant) {
		return null;
	}

	const branding = getTenantBrandingBySlug(tenant.slug);
	if (!branding) {
		return null;
	}

	return (
		<HostTenantThemeApplier
			theme={{
				primaryColor: branding.primaryColor,
				secondaryColor: branding.secondaryColor,
			}}
		/>
	);
}
