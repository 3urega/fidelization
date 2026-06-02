import "reflect-metadata";

import { NextResponse } from "next/server";

import { ListPlatformTenants } from "../../../../contexts/platform/application/tenants/ListPlatformTenants";
import { container } from "../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { platformTenantToJson } from "../../../../lib/auth/http";
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

	const tenants = await container.get(ListPlatformTenants).execute();

	return NextResponse.json({
		tenants: tenants.map((tenant) => platformTenantToJson(tenant)),
	});
}
