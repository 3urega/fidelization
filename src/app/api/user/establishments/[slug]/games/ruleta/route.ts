import "reflect-metadata";

import { NextResponse } from "next/server";

import { GetEstablishmentDetailForUser } from "../../../../../../contexts/loyalty/customers/application/profile/GetEstablishmentDetailForUser";
import { GetRoulettePublicState } from "../../../../../../contexts/loyalty/games/application/spin/GetRoulettePublicState";
import { DomainError } from "../../../../../../contexts/shared/domain/DomainError";
import { container } from "../../../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { HttpNextResponse } from "../../../../../../contexts/shared/infrastructure/http/HttpNextResponse";
import { TenantNotFound } from "../../../../../../contexts/tenants/tenants/domain/TenantNotFound";
import { handleAuthDomainError } from "../../../../../../lib/auth/http";
import { requireUserSession } from "../../../../../../lib/auth/requireUserSession";
import { roulettePublicStateToJson } from "../../../../../../lib/loyalty/roulettePublicStateJson";
import { getResolvedTenantFromRequest } from "../../../../../../lib/tenant/getResolvedTenant";

export const dynamic = "force-dynamic";

type RouteContext = {
	params: { slug: string };
};

function rejectIfTenantHost(request: Request): NextResponse | null {
	if (getResolvedTenantFromRequest(request)) {
		return NextResponse.json(
			{
				error: {
					description:
						"Establishment roulette is only available on the apex host (no business subdomain).",
				},
			},
			{ status: 403 },
		);
	}

	return null;
}

export async function GET(request: Request, context: RouteContext): Promise<Response> {
	const tenantHostError = rejectIfTenantHost(request);
	if (tenantHostError) {
		return tenantHostError;
	}

	try {
		const auth = await requireUserSession(request);
		if (auth instanceof NextResponse) {
			return auth;
		}

		const slug = context.params.slug?.trim() ?? "";
		if (!slug) {
			return NextResponse.json({ error: { description: "slug is required" } }, { status: 400 });
		}

		const detail = await container.get(GetEstablishmentDetailForUser).execute({
			userId: auth.session.userId,
			slug,
		});

		if (!detail.customer) {
			return NextResponse.json(
				{ error: { description: "Join this establishment before using the roulette" } },
				{ status: 403 },
			);
		}

		const state = await container.get(GetRoulettePublicState).execute({
			tenantId: detail.tenant.id,
			customerId: detail.customer.id,
		});

		return NextResponse.json(roulettePublicStateToJson(state));
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
