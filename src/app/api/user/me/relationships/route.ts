import "reflect-metadata";

import { NextResponse } from "next/server";

import { ListUserRelationships } from "../../../../contexts/tenants/memberships/application/list/ListUserRelationships";
import { container } from "../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { requireUserSession } from "../../../../lib/auth/requireUserSession";
import { getResolvedTenantFromRequest } from "../../../../lib/tenant/getResolvedTenant";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
	if (getResolvedTenantFromRequest(request)) {
		return NextResponse.json(
			{
				error: {
					description:
						"User relationships are only available on the apex host (no business subdomain).",
				},
			},
			{ status: 403 },
		);
	}

	const auth = await requireUserSession(request);
	if (auth instanceof NextResponse) {
		return auth;
	}

	const relationships = await container.get(ListUserRelationships).list(auth.session.userId);

	return NextResponse.json(relationships);
}
