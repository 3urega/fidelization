import "reflect-metadata";

import { NextResponse } from "next/server";

import { DomainError } from "../../../../../contexts/shared/domain/DomainError";
import { HttpNextResponse } from "../../../../../contexts/shared/infrastructure/http/HttpNextResponse";
import { ListEstablishmentMapMarkersNearPoint } from "../../../../../contexts/tenants/tenants/application/list/ListEstablishmentMapMarkersNearPoint";
import { parseDiscoverNearFilter } from "../../../../../contexts/tenants/tenants/domain/DiscoverNearFilter";
import { InvalidDiscoverNearFilter } from "../../../../../contexts/tenants/tenants/domain/InvalidDiscoverNearFilter";
import { container } from "../../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { requireUserSession } from "../../../../../lib/auth/requireUserSession";
import { getResolvedTenantFromRequest } from "../../../../../lib/tenant/getResolvedTenant";

export const dynamic = "force-dynamic";

function rejectIfTenantHost(request: Request): NextResponse | null {
	if (getResolvedTenantFromRequest(request)) {
		return NextResponse.json(
			{
				error: {
					description:
						"User search zone is only available on the apex host (no business subdomain).",
				},
			},
			{ status: 403 },
		);
	}

	return null;
}

export async function GET(request: Request): Promise<Response> {
	const tenantHostError = rejectIfTenantHost(request);
	if (tenantHostError) {
		return tenantHostError;
	}

	try {
		const auth = await requireUserSession(request);
		if (auth instanceof NextResponse) {
			return auth;
		}

		const url = new URL(request.url);

		let near;
		try {
			near = parseDiscoverNearFilter(
				url.searchParams.get("lat"),
				url.searchParams.get("lng"),
				url.searchParams.get("radiusKm"),
			);
		} catch (error) {
			if (error instanceof InvalidDiscoverNearFilter) {
				return HttpNextResponse.domainError(error, 400);
			}

			throw error;
		}

		if (!near) {
			return NextResponse.json(
				{ error: { description: "lat and lng are required" } },
				{ status: 400 },
			);
		}

		const result = await container.get(ListEstablishmentMapMarkersNearPoint).execute({ near });

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
