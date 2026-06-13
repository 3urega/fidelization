import "reflect-metadata";

import { NextResponse } from "next/server";

import { GetPlatformDashboardMetrics } from "../../../../contexts/platform/application/dashboard/GetPlatformDashboardMetrics";
import { container } from "../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { platformDashboardMetricsToJson } from "../../../../lib/auth/http";
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

	const metrics = await container.get(GetPlatformDashboardMetrics).execute();

	return NextResponse.json(platformDashboardMetricsToJson(metrics));
}
