import { NextResponse } from "next/server";

import {
	getAuthenticatedSession,
	isImpersonatingTenantSession,
	type TenantSessionClaims,
} from "./session";

export type ImpersonatingTenantSessionContext = {
	session: TenantSessionClaims;
};

export async function requireImpersonatingTenantSession(
	request: Request,
): Promise<ImpersonatingTenantSessionContext | NextResponse> {
	const session = await getAuthenticatedSession(request);

	if (!session || !isImpersonatingTenantSession(session)) {
		return NextResponse.json({ error: { description: "Unauthorized" } }, { status: 401 });
	}

	return { session };
}
