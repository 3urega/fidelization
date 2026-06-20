import { NextResponse } from "next/server";

import { RouletteConfigForbidden } from "../../contexts/loyalty/games/domain/RouletteConfigForbidden";
import { HttpNextResponse } from "../../contexts/shared/infrastructure/http/HttpNextResponse";
import { TenantRole } from "../../contexts/tenants/memberships/domain/TenantRole";
import type { TenantSessionClaims } from "../auth/session";

export function requireOwnerRouletteConfigAccess(
	session: TenantSessionClaims,
): NextResponse | null {
	if (session.role !== TenantRole.Owner) {
		return HttpNextResponse.domainError(
			new RouletteConfigForbidden(session.role as TenantRole),
			403,
		);
	}

	return null;
}
