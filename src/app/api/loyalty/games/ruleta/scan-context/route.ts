import "reflect-metadata";

import { NextResponse } from "next/server";

import { GetStaffRouletteScanContext } from "../../../../../../contexts/loyalty/games/application/config/GetStaffRouletteScanContext";
import { DomainError } from "../../../../../../contexts/shared/domain/DomainError";
import { container } from "../../../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { HttpNextResponse } from "../../../../../../contexts/shared/infrastructure/http/HttpNextResponse";
import { TenantNotFound } from "../../../../../../contexts/tenants/tenants/domain/TenantNotFound";
import { handleAuthDomainError } from "../../../../../../lib/auth/http";
import { requireTenantSession } from "../../../../../../lib/auth/requireTenantSession";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
	const auth = await requireTenantSession(request);

	if (auth instanceof NextResponse) {
		return auth;
	}

	try {
		const context = await container.get(GetStaffRouletteScanContext).execute({
			tenantId: auth.session.tenantId,
		});

		return NextResponse.json(context);
	} catch (error) {
		if (error instanceof DomainError) {
			const response = handleAuthDomainError(error);

			if (response) {
				return response;
			}
		}

		if (error instanceof TenantNotFound) {
			return HttpNextResponse.domainError(error, 404);
		}

		throw error;
	}
}
