import "reflect-metadata";

import { NextResponse } from "next/server";

import { ListDiscoverableEstablishments } from "../../../../contexts/tenants/tenants/application/list/ListDiscoverableEstablishments";
import { container } from "../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { requireUserSession } from "../../../../lib/auth/requireUserSession";
import { getResolvedTenantFromRequest } from "../../../../lib/tenant/getResolvedTenant";

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

export async function GET(request: Request): Promise<Response> {
	if (getResolvedTenantFromRequest(request)) {
		return NextResponse.json(
			{
				error: {
					description:
						"Establishment discovery is only available on the apex host (no business subdomain).",
				},
			},
			{ status: 403 },
		);
	}

	const auth = await requireUserSession(request);
	if (auth instanceof NextResponse) {
		return auth;
	}

	const { searchParams } = new URL(request.url);
	const page = parseNonNegativeInt(searchParams.get("page"), 0);
	const limit = parsePositiveInt(searchParams.get("limit"), 20, 50);
	const offsetParam = searchParams.get("offset");
	const offset =
		offsetParam !== null
			? parseNonNegativeInt(offsetParam, 0)
			: page * limit;

	const result = await container.get(ListDiscoverableEstablishments).execute({ offset, limit });

	return NextResponse.json(result);
}
