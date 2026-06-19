import "reflect-metadata";

import { NextResponse } from "next/server";

import { GetInteractiveMapClientConfig } from "../../../../../contexts/identity/users/application/profile/GetInteractiveMapClientConfig";
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

		const config = container.get(GetInteractiveMapClientConfig).execute();

		return NextResponse.json(config);
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
