import "reflect-metadata";

import { NextResponse } from "next/server";

import { GetEstablishmentDetailForUser } from "../../../../../../../contexts/loyalty/customers/application/profile/GetEstablishmentDetailForUser";
import { RedeemCustomerReward } from "../../../../../../../contexts/loyalty/customers/application/redeem/RedeemCustomerReward";
import { DomainError } from "../../../../../../../contexts/shared/domain/DomainError";
import { container } from "../../../../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { HttpNextResponse } from "../../../../../../../contexts/shared/infrastructure/http/HttpNextResponse";
import { TenantNotFound } from "../../../../../../../contexts/tenants/tenants/domain/TenantNotFound";
import { customerToJson, handleAuthDomainError } from "../../../../../../../lib/auth/http";
import { requireUserSession } from "../../../../../../../lib/auth/requireUserSession";
import { getResolvedTenantFromRequest } from "../../../../../../../lib/tenant/getResolvedTenant";

type RouteContext = {
	params: { slug: string };
};

type Body = {
	rewardId?: string;
};

function rejectIfTenantHost(request: Request): NextResponse | null {
	if (getResolvedTenantFromRequest(request)) {
		return NextResponse.json(
			{
				error: {
					description:
						"Establishment redeem is only available on the apex host (no business subdomain).",
				},
			},
			{ status: 403 },
		);
	}

	return null;
}

export async function POST(request: Request, context: RouteContext): Promise<Response> {
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

		const body = (await request.json()) as Body;
		const rewardId = body.rewardId?.trim();
		if (!rewardId) {
			return NextResponse.json({ error: { description: "rewardId is required" } }, { status: 400 });
		}

		const detail = await container.get(GetEstablishmentDetailForUser).execute({
			userId: auth.session.userId,
			slug,
		});

		if (!detail.customer) {
			return NextResponse.json(
				{ error: { description: "Join this establishment before redeeming rewards" } },
				{ status: 403 },
			);
		}

		const result = await container.get(RedeemCustomerReward).execute({
			tenantId: detail.tenant.id,
			customerId: detail.customer.id,
			rewardId,
		});

		return NextResponse.json({
			customer: customerToJson(result.customer),
			rewardId: result.rewardId,
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
