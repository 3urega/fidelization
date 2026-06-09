import "reflect-metadata";

import { NextResponse } from "next/server";

import { GetEstablishmentDetailForUser } from "../../../../../contexts/loyalty/customers/application/profile/GetEstablishmentDetailForUser";
import { DomainError } from "../../../../../contexts/shared/domain/DomainError";
import { container } from "../../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { HttpNextResponse } from "../../../../../contexts/shared/infrastructure/http/HttpNextResponse";
import { TenantNotFound } from "../../../../../contexts/tenants/tenants/domain/TenantNotFound";
import {
	customerToJson,
	handleAuthDomainError,
	promotionToJson,
} from "../../../../../lib/auth/http";
import { requireUserSession } from "../../../../../lib/auth/requireUserSession";
import { getResolvedTenantFromRequest } from "../../../../../lib/tenant/getResolvedTenant";

type RouteContext = {
	params: { slug: string };
};

function rejectIfTenantHost(request: Request): NextResponse | null {
	if (getResolvedTenantFromRequest(request)) {
		return NextResponse.json(
			{
				error: {
					description:
						"Establishment detail is only available on the apex host (no business subdomain).",
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

		return NextResponse.json({
			mode: detail.mode,
			tenant: {
				id: detail.tenant.id,
				name: detail.tenant.name,
				slug: detail.tenant.slug,
				logoUrl: detail.tenant.logoUrl,
				primaryColor: detail.tenant.primaryColor,
				secondaryColor: detail.tenant.secondaryColor,
				subscriptionPlan: detail.tenant.subscriptionPlan,
				status: detail.tenant.status,
			},
			promotions: detail.promotions.map((promotion) => promotionToJson(promotion)),
			customer: detail.customer ? customerToJson(detail.customer) : null,
		});
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
