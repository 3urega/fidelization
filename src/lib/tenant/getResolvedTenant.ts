import { headers } from "next/headers";

import { readResolvedTenantFromHeaders } from "./forwardResolvedTenantHeaders";
import type { ResolvedTenant } from "./resolveTenant";
import { resolveTenantFromHost } from "./resolveTenant";

function resolveFromIncomingHeaders(incoming: Headers): ResolvedTenant | null {
	const fromMiddleware = readResolvedTenantFromHeaders(incoming);

	if (fromMiddleware) {
		return fromMiddleware;
	}

	return resolveTenantFromHost(incoming.get("host"));
}

/** Read tenant injected by middleware (Server Components / Route Handlers). */

export function getResolvedTenantFromHeaders(): ResolvedTenant | null {
	return resolveFromIncomingHeaders(headers());
}

/** Read tenant from an incoming Request (API routes). */

export function getResolvedTenantFromRequest(request: Request): ResolvedTenant | null {
	return resolveFromIncomingHeaders(request.headers);
}
