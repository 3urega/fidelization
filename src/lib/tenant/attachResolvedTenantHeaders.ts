import type { NextResponse } from "next/server";

import type { ResolvedTenant } from "./resolveTenant";

/** Optional request headers for downstream handlers (target multi-tenant middleware). */
export function attachResolvedTenantHeaders(
	response: NextResponse,
	tenant: ResolvedTenant | null,
): NextResponse {
	if (tenant) {
		response.headers.set("x-tenant-id", tenant.tenantId);
		response.headers.set("x-tenant-slug", tenant.slug);
	}

	return response;
}
