import "reflect-metadata";

import { NextResponse } from "next/server";

import { GeocodeUserSearchZoneQuery } from "../../../../../contexts/identity/users/application/profile/GeocodeUserSearchZoneQuery";
import { DomainError } from "../../../../../contexts/shared/domain/DomainError";
import { container } from "../../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { handleGeocodingDomainError } from "../../../../../lib/geocoding/handleGeocodingDomainError";
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

type PostBody = {
	query?: string;
};

export async function POST(request: Request): Promise<Response> {
	const tenantHostError = rejectIfTenantHost(request);
	if (tenantHostError) {
		return tenantHostError;
	}

	try {
		const auth = await requireUserSession(request);
		if (auth instanceof NextResponse) {
			return auth;
		}

		const body = (await request.json()) as PostBody;
		const query = typeof body.query === "string" ? body.query : "";

		const result = await container.get(GeocodeUserSearchZoneQuery).execute({ query });

		return NextResponse.json(result);
	} catch (error) {
		if (error instanceof DomainError) {
			const response = handleGeocodingDomainError(error);
			if (response) {
				return response;
			}
		}

		throw error;
	}
}
