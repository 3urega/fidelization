import "reflect-metadata";

import { NextResponse } from "next/server";

import { CreatePromotion } from "../../../../contexts/loyalty/promotions/application/create/CreatePromotion";
import { ListPromotions } from "../../../../contexts/loyalty/promotions/application/list/ListPromotions";
import { DomainError } from "../../../../contexts/shared/domain/DomainError";
import { container } from "../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { HttpNextResponse } from "../../../../contexts/shared/infrastructure/http/HttpNextResponse";
import { TenantNotFound } from "../../../../contexts/tenants/tenants/domain/TenantNotFound";
import { TenantRole } from "../../../../contexts/tenants/memberships/domain/TenantRole";
import { handleAuthDomainError, promotionToJson } from "../../../../lib/auth/http";
import { requireTenantSession } from "../../../../lib/auth/requireTenantSession";

export const dynamic = "force-dynamic";

type Body = {
	title?: string;
	description?: string;
	type?: string;
	startDate?: string;
	endDate?: string;
	maxUsesPerUser?: number | null;
};

export async function GET(request: Request): Promise<Response> {
	const auth = await requireTenantSession(request);
	if (auth instanceof NextResponse) {
		return auth;
	}

	try {
		const promotions = await container.get(ListPromotions).execute({
			tenantId: auth.session.tenantId,
			role: auth.session.role as TenantRole,
		});

		return NextResponse.json({
			promotions: promotions.map((promotion) => promotionToJson(promotion)),
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

export async function POST(request: Request): Promise<Response> {
	const auth = await requireTenantSession(request);
	if (auth instanceof NextResponse) {
		return auth;
	}

	const body = (await request.json()) as Body;

	try {
		const promotion = await container.get(CreatePromotion).execute({
			tenantId: auth.session.tenantId,
			role: auth.session.role as TenantRole,
			input: body,
		});

		return NextResponse.json({ promotion: promotionToJson(promotion) }, { status: 201 });
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
