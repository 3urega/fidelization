import { NextResponse } from "next/server";

import { container } from "../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { TenantSessionVerifier } from "../../contexts/tenants/memberships/application/verify/TenantSessionVerifier";
import { CrossTenantAccessDenied } from "../../contexts/tenants/memberships/domain/CrossTenantAccessDenied";
import { InvalidTenantSession } from "../../contexts/tenants/memberships/domain/InvalidTenantSession";
import { StaffMembership } from "../../contexts/tenants/memberships/domain/TenantMembershipRepository";
import { getResolvedTenantFromRequest } from "../tenant/getResolvedTenant";
import { getAuthenticatedSession, isTenantSession, type TenantSessionClaims } from "./session";

export type TenantSessionContext = {
	session: TenantSessionClaims;
	membership: StaffMembership;
};

export async function requireTenantSession(
	request: Request,
): Promise<TenantSessionContext | NextResponse> {
	const session = await getAuthenticatedSession(request);

	if (!session || !isTenantSession(session)) {
		return NextResponse.json({ error: { description: "Unauthorized" } }, { status: 401 });
	}

	const hostTenant = getResolvedTenantFromRequest(request);

	try {
		const membership = await container
			.get(TenantSessionVerifier)
			.verify(session, hostTenant?.tenantId);

		return { session, membership };
	} catch (error) {
		if (error instanceof CrossTenantAccessDenied) {
			return NextResponse.json({ error: { description: error.message } }, { status: 403 });
		}

		if (error instanceof InvalidTenantSession) {
			return NextResponse.json({ error: { description: error.message } }, { status: 401 });
		}

		throw error;
	}
}
