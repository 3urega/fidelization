import "reflect-metadata";

import { NextResponse } from "next/server";

import { ListPlatformOwners } from "../../../../contexts/platform/application/owners/ListPlatformOwners";
import { container } from "../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { requirePlatformSession } from "../../../../lib/auth/requirePlatformSession";
import { platformOwnersPageToJson } from "../../../../lib/platform/owners";
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
			{ error: { description: "Forbidden on business subdomain" } },
			{ status: 403 },
		);
	}

	const auth = await requirePlatformSession(request);
	if (auth instanceof NextResponse) {
		return auth;
	}

	const { searchParams } = new URL(request.url);
	const limit = parsePositiveInt(searchParams.get("limit"), 20, 50);
	const offset = parseNonNegativeInt(searchParams.get("offset"), 0);
	const pageParam = searchParams.get("page");
	const pageNumber =
		pageParam !== null ? parseNonNegativeInt(pageParam, 0) : undefined;
	const search = searchParams.get("q")?.trim() || undefined;

	const result = await container.get(ListPlatformOwners).execute({
		offset: pageNumber !== undefined ? undefined : offset,
		page: pageNumber,
		limit,
		search,
	});

	return NextResponse.json(platformOwnersPageToJson(result));
}
