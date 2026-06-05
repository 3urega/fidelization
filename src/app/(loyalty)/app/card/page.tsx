import type { ReactElement } from "react";

import { CustomerCardContent } from "../../../_components/loyalty/CustomerCardContent";
import { getResolvedTenantFromHeaders } from "../../../../lib/tenant/getResolvedTenant";
import { getTenantBrandingBySlug } from "../../../../lib/tenant/mockTenantBySlug";

export default function CustomerCardPage(): ReactElement {
	const tenant = getResolvedTenantFromHeaders();
	const branding = tenant ? getTenantBrandingBySlug(tenant.slug) : null;

	return <CustomerCardContent businessName={branding?.name} />;
}
