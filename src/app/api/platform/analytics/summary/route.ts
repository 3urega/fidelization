import "reflect-metadata";

import { NextResponse } from "next/server";

import { GetPlatformAnalyticsSummary } from "../../../../../contexts/platform/application/analytics/GetPlatformAnalyticsSummary";
import { container } from "../../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { platformAnalyticsSummaryToJson } from "../../../../../lib/platform/analytics";
import { requirePlatformSession } from "../../../../../lib/auth/requirePlatformSession";
import { getResolvedTenantFromRequest } from "../../../../../lib/tenant/getResolvedTenant";

export const dynamic = "force-dynamic";

function parsePeriodDays(request: Request): number | undefined {
	const value = new URL(request.url).searchParams.get("periodDays");
	if (!value) {
		return undefined;
	}

	const parsed = Number(value);
	if (!Number.isInteger(parsed)) {
		return Number.NaN;
	}

	return parsed;
}

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

	const periodDays = parsePeriodDays(request);
	if (periodDays !== undefined && Number.isNaN(periodDays)) {
		return NextResponse.json({ error: { description: "periodDays must be 7 or 30" } }, { status: 400 });
	}

	try {
		const summary = await container.get(GetPlatformAnalyticsSummary).execute({ periodDays });

		return NextResponse.json(platformAnalyticsSummaryToJson(summary));
	} catch (error) {
		if (error instanceof Error && error.message.includes("periodDays")) {
			return NextResponse.json({ error: { description: error.message } }, { status: 400 });
		}

		throw error;
	}
}
