import "reflect-metadata";

import { NextResponse } from "next/server";

import { RecordPromotionUse } from "../../../../../../contexts/loyalty/customers/application/promotions/RecordPromotionUse";
import { DomainError } from "../../../../../../contexts/shared/domain/DomainError";
import { container } from "../../../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { HttpNextResponse } from "../../../../../../contexts/shared/infrastructure/http/HttpNextResponse";
import { TenantNotFound } from "../../../../../../contexts/tenants/tenants/domain/TenantNotFound";
import { TenantRole } from "../../../../../../contexts/tenants/memberships/domain/TenantRole";
import {
	customerPromotionSummaryToJson,
	customerToJson,
	handleAuthDomainError,
} from "../../../../../../lib/auth/http";
import { requireTenantSession } from "../../../../../../lib/auth/requireTenantSession";

export const dynamic = "force-dynamic";

type RouteContext = {
	params: { promotionId: string };
};

type Body = {
	qrValue?: string;
};

export async function POST(request: Request, context: RouteContext): Promise<Response> {
	const auth = await requireTenantSession(request);
	if (auth instanceof NextResponse) {
		return auth;
	}

	const body = (await request.json()) as Body;
	if (!body.qrValue?.trim()) {
		return NextResponse.json({ error: { description: "qrValue is required" } }, { status: 400 });
	}

	try {
		const result = await container.get(RecordPromotionUse).execute({
			tenantId: auth.session.tenantId,
			promotionId: context.params.promotionId,
			qrValue: body.qrValue,
			createdByUserId: auth.session.userId,
			staffRole: auth.session.role as TenantRole,
		});

		return NextResponse.json({
			customer: customerToJson(result.customer),
			promotion: customerPromotionSummaryToJson(result.summary),
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
