import type { ReactElement } from "react";

import { getResolvedTenantFromHeaders } from "../../lib/tenant/getResolvedTenant";
import { getTenantBrandingBySlug } from "../../lib/tenant/mockTenantBySlug";

export function AuthTenantBanner(): ReactElement | null {
	const tenant = getResolvedTenantFromHeaders();

	if (tenant) {
		const branding = getTenantBrandingBySlug(tenant.slug);

		return (
			<p className="mb-4 text-center text-sm text-muted">
				Accediendo a{" "}
				<span className="font-medium text-foreground">{branding?.name ?? tenant.slug}</span>
			</p>
		);
	}

	if (process.env.APP_DOMAIN) {
		return (
			<p className="mb-4 text-center text-sm text-muted">
				Sin subdominio de negocio: el acceso usará tu primer negocio asociado como propietario.
			</p>
		);
	}

	return null;
}
