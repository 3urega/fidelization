import type { NextResponse } from "next/server";

import { TENANT_ID_HEADER, TENANT_SLUG_HEADER } from "./forwardResolvedTenantHeaders";
import type { ResolvedTenant } from "./resolveTenant";

/** Mirror resolved tenant on the response (visible in Network tab). */
export function attachResolvedTenantHeaders(
	response: NextResponse,
	tenant: ResolvedTenant | null,
): NextResponse {
	if (tenant) {
		response.headers.set(TENANT_ID_HEADER, tenant.tenantId);
		response.headers.set(TENANT_SLUG_HEADER, tenant.slug);
	}

	return response;
}
