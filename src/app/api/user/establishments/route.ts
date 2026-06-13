import "reflect-metadata";

import { NextResponse } from "next/server";

import { DomainError } from "../../../../contexts/shared/domain/DomainError";
import { HttpNextResponse } from "../../../../contexts/shared/infrastructure/http/HttpNextResponse";
import { ListDiscoverableEstablishments } from "../../../../contexts/tenants/tenants/application/list/ListDiscoverableEstablishments";
import { InvalidDiscoverFilter } from "../../../../contexts/tenants/tenants/domain/InvalidDiscoverFilter";
import { InvalidDiscoverNearFilter } from "../../../../contexts/tenants/tenants/domain/InvalidDiscoverNearFilter";
import { parseDiscoverNearFilter } from "../../../../contexts/tenants/tenants/domain/DiscoverNearFilter";
import { parseDiscoverFilterTags } from "../../../../contexts/tenants/tenants/domain/TenantDiscoveryTag";
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

function parseTagsQueryParam(searchParams: URLSearchParams): unknown {
	const repeated = searchParams.getAll("tags");

	if (repeated.length === 0) {
		return [];
	}

	return repeated;
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

	let tags;
	try {
		tags = parseDiscoverFilterTags(parseTagsQueryParam(searchParams));
	} catch (error) {
		if (error instanceof InvalidDiscoverFilter) {
			return HttpNextResponse.domainError(error, 400);
		}

		throw error;
	}

	let near;
	try {
		near = parseDiscoverNearFilter(
			searchParams.get("lat"),
			searchParams.get("lng"),
			searchParams.get("radiusKm"),
		);
	} catch (error) {
		if (error instanceof InvalidDiscoverNearFilter) {
			return HttpNextResponse.domainError(error, 400);
		}

		throw error;
	}

	const page = parseNonNegativeInt(searchParams.get("page"), 0);
	const limit = parsePositiveInt(searchParams.get("limit"), 20, 50);
	const offsetParam = searchParams.get("offset");
	const offset =
		offsetParam !== null
			? parseNonNegativeInt(offsetParam, 0)
			: page * limit;

	try {
		const result = await container.get(ListDiscoverableEstablishments).execute({
			offset,
			limit,
			tags,
			near,
		});

		return NextResponse.json(result);
	} catch (error) {
		if (error instanceof DomainError) {
			const response = HttpNextResponse.domainError(error, 400);
			if (response) {
				return response;
			}
		}

		throw error;
	}
}
