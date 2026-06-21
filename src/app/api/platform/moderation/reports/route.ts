import "reflect-metadata";

import { NextResponse } from "next/server";

import { ListModerationReports } from "../../../../../contexts/platform/application/moderation/ListModerationReports";
import { type ModerationReportStatus } from "../../../../../contexts/platform/domain/ModerationReportTypes";
import { container } from "../../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { requirePlatformSession } from "../../../../../lib/auth/requirePlatformSession";
import { moderationReportsPageToJson } from "../../../../../lib/platform/moderation";
import { getResolvedTenantFromRequest } from "../../../../../lib/tenant/getResolvedTenant";

export const dynamic = "force-dynamic";

function parseNonNegativeInt(value: string | null, fallback: number): number {
	if (!value) {
		return fallback;
	}

	const parsed = Number.parseInt(value, 10);

	if (!Number.isInteger(parsed) || parsed < 0) {
		return fallback;
	}

	return parsed;
}

function parsePositiveInt(value: string | null, fallback: number, max: number): number {
	if (!value) {
		return fallback;
	}

	const parsed = Number.parseInt(value, 10);

	if (!Number.isInteger(parsed) || parsed < 1) {
		return fallback;
	}

	return Math.min(parsed, max);
}

function parseStatus(value: string | null): ModerationReportStatus | undefined {
	if (value === "open" || value === "resolved") {
		return value;
	}

	return undefined;
}

function forbiddenOnTenantSubdomain(request: Request): Response | null {
	if (getResolvedTenantFromRequest(request)) {
		return NextResponse.json(
			{ error: { description: "Forbidden on business subdomain" } },
			{ status: 403 },
		);
	}

	return null;
}

export async function GET(request: Request): Promise<Response> {
	const forbidden = forbiddenOnTenantSubdomain(request);

	if (forbidden) {
		return forbidden;
	}

	const auth = await requirePlatformSession(request);

	if (auth instanceof NextResponse) {
		return auth;
	}

	const { searchParams } = new URL(request.url);
	const limit = parsePositiveInt(searchParams.get("limit"), 20, 50);
	const offset = parseNonNegativeInt(searchParams.get("offset"), 0);
	const status = parseStatus(searchParams.get("status"));

	const page = await container.get(ListModerationReports).execute({ limit, offset, status });

	return NextResponse.json(moderationReportsPageToJson(page));
}
