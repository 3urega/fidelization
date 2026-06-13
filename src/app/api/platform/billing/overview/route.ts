import "reflect-metadata";

import { NextResponse } from "next/server";

import { GetPlatformBillingOverview } from "../../../../../contexts/platform/application/billing/GetPlatformBillingOverview";
import { container } from "../../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { platformBillingOverviewToJson } from "../../../../../lib/platform/billing";
import { requirePlatformSession } from "../../../../../lib/auth/requirePlatformSession";
import { getResolvedTenantFromRequest } from "../../../../../lib/tenant/getResolvedTenant";

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

	const overview = await container.get(GetPlatformBillingOverview).execute();

	return NextResponse.json(platformBillingOverviewToJson(overview));
}
