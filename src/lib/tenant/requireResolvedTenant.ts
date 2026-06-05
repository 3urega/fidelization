import { NextResponse } from "next/server";

import { getResolvedTenantFromRequest } from "./getResolvedTenant";
import type { ResolvedTenant } from "./resolveTenant";

export function requireResolvedTenant(request: Request): ResolvedTenant | NextResponse {
	const tenant = getResolvedTenantFromRequest(request);

	if (!tenant) {
		return NextResponse.json(
			{ error: { description: "Tenant host required" } },
			{ status: 400 },
		);
	}

	return tenant;
}
