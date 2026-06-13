import "reflect-metadata";

import { NextResponse } from "next/server";

import { ListAvailablePlatformGamesForTenant } from "../../../../contexts/platform/application/games/ListAvailablePlatformGamesForTenant";
import { container } from "../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { TenantNotFound } from "../../../../contexts/tenants/tenants/domain/TenantNotFound";
import { DomainError } from "../../../../contexts/shared/domain/DomainError";
import { HttpNextResponse } from "../../../../contexts/shared/infrastructure/http/HttpNextResponse";
import { handleAuthDomainError } from "../../../../lib/auth/http";
import { requireTenantSession } from "../../../../lib/auth/requireTenantSession";
import { platformGamesToJson } from "../../../../lib/platform/games";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
	const auth = await requireTenantSession(request);
	if (auth instanceof NextResponse) {
		return auth;
	}

	try {
		const games = await container.get(ListAvailablePlatformGamesForTenant).execute({
			tenantId: auth.session.tenantId,
		});

		return NextResponse.json(platformGamesToJson(games));
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
