import "reflect-metadata";

import { NextResponse } from "next/server";

import { SuggestSearchZonePlaces } from "../../../../../contexts/identity/users/application/profile/SuggestSearchZonePlaces";
import { DomainError } from "../../../../../contexts/shared/domain/DomainError";
import { container } from "../../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { requireUserSession } from "../../../../../lib/auth/requireUserSession";
import { handleGeocodingDomainError } from "../../../../../lib/geocoding/handleGeocodingDomainError";
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

function parseLimit(raw: string | null): number | undefined {
	if (raw === null || raw.trim() === "") {
		return undefined;
	}

	const parsed = Number.parseInt(raw, 10);

	return Number.isFinite(parsed) ? parsed : undefined;
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
		const query = url.searchParams.get("q") ?? "";
		const limit = parseLimit(url.searchParams.get("limit"));

		const result = await container.get(SuggestSearchZonePlaces).execute({ query, limit });

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
