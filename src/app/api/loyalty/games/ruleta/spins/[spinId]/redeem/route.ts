import "reflect-metadata";

import { NextResponse } from "next/server";

import { RedeemRouletteSpin } from "../../../../../../../../contexts/loyalty/games/application/redeem/RedeemRouletteSpin";
import { DomainError } from "../../../../../../../../contexts/shared/domain/DomainError";
import { container } from "../../../../../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { HttpNextResponse } from "../../../../../../../../contexts/shared/infrastructure/http/HttpNextResponse";
import { TenantNotFound } from "../../../../../../../../contexts/tenants/tenants/domain/TenantNotFound";
import { TenantRole } from "../../../../../../../../contexts/tenants/memberships/domain/TenantRole";
import { handleAuthDomainError } from "../../../../../../../../lib/auth/http";
import { requireTenantSession } from "../../../../../../../../lib/auth/requireTenantSession";
import { redeemRouletteSpinResultToJson } from "../../../../../../../../lib/loyalty/rouletteSpinJson";

export const dynamic = "force-dynamic";

type RouteContext = {
	params: { spinId: string };
};

export async function POST(request: Request, context: RouteContext): Promise<Response> {
	const auth = await requireTenantSession(request);
	if (auth instanceof NextResponse) {
		return auth;
	}

	const spinId = context.params.spinId?.trim() ?? "";
	if (!spinId) {
		return NextResponse.json({ error: { description: "spinId is required" } }, { status: 400 });
	}

	try {
		const result = await container.get(RedeemRouletteSpin).execute({
			tenantId: auth.session.tenantId,
			spinId,
			staffRole: auth.session.role as TenantRole,
			staffUserId: auth.session.userId,
		});

		return NextResponse.json(redeemRouletteSpinResultToJson(result));
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
