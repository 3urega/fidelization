import "reflect-metadata";

import { NextResponse } from "next/server";

import { userToJson } from "../../../../lib/auth/http";
import { requirePlatformSession } from "../../../../lib/auth/requirePlatformSession";
import { getResolvedTenantFromRequest } from "../../../../lib/tenant/getResolvedTenant";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
	if (getResolvedTenantFromRequest(request)) {
		return NextResponse.json(
			{ error: { description: "Forbidden on business subdomain" } },
			{ status: 403 },
		);
	}

	const auth = await requirePlatformSession(request);
	if (auth instanceof NextResponse) {
		return auth;
	}

	return NextResponse.json({
		user: userToJson(auth.user),
		role: auth.session.role,
		kind: auth.session.kind,
	});
}
