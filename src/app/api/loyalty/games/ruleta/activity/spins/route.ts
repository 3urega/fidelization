import "reflect-metadata";

import { NextResponse } from "next/server";

import { ListRouletteActivitySpins } from "../../../../../../../contexts/loyalty/games/application/activity/ListRouletteActivitySpins";
import { DomainError } from "../../../../../../../contexts/shared/domain/DomainError";
import { container } from "../../../../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { HttpNextResponse } from "../../../../../../../contexts/shared/infrastructure/http/HttpNextResponse";
import { TenantNotFound } from "../../../../../../../contexts/tenants/tenants/domain/TenantNotFound";
import { handleAuthDomainError } from "../../../../../../../lib/auth/http";
import { requireTenantSession } from "../../../../../../../lib/auth/requireTenantSession";
import { rouletteActivitySpinsToJson } from "../../../../../../../lib/loyalty/rouletteActivityDashboard";
import { requireOwnerRouletteConfigAccess } from "../../../../../../../lib/loyalty/requireOwnerRouletteConfigAccess";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
	const auth = await requireTenantSession(request);
	if (auth instanceof NextResponse) {
		return auth;
	}

	const forbidden = requireOwnerRouletteConfigAccess(auth.session);
	if (forbidden) {
		return forbidden;
	}

	const url = new URL(request.url);
	const dateQuery = url.searchParams.get("date");
	const segmentId = url.searchParams.get("segmentId") ?? "";

	try {
		const result = await container.get(ListRouletteActivitySpins).execute({
			tenantId: auth.session.tenantId,
			role: auth.session.role,
			segmentId,
			dateQuery,
		});

		return NextResponse.json(rouletteActivitySpinsToJson(result));
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
