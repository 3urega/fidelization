import type { NextRequest } from "next/server";

import type { ResolvedTenant } from "./resolveTenant";

export const TENANT_ID_HEADER = "x-tenant-id";
export const TENANT_SLUG_HEADER = "x-tenant-slug";

export function forwardResolvedTenantHeaders(
	request: NextRequest,
	tenant: ResolvedTenant | null,
): Headers {
	const headers = new Headers(request.headers);

	if (tenant) {
		headers.set(TENANT_ID_HEADER, tenant.tenantId);
		headers.set(TENANT_SLUG_HEADER, tenant.slug);
	}

	return headers;
}

export function readResolvedTenantFromHeaders(headers: Headers): ResolvedTenant | null {
	const tenantId = headers.get(TENANT_ID_HEADER);
	const slug = headers.get(TENANT_SLUG_HEADER);

	if (!tenantId || !slug) {
		return null;
	}

	return { tenantId, slug };
}
