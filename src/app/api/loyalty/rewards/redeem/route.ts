import "reflect-metadata";

import { NextResponse } from "next/server";

import { RedeemCustomerReward } from "../../../../../contexts/loyalty/customers/application/redeem/RedeemCustomerReward";
import { DomainError } from "../../../../../contexts/shared/domain/DomainError";
import { container } from "../../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { TenantNotFound } from "../../../../../contexts/tenants/tenants/domain/TenantNotFound";
import { HttpNextResponse } from "../../../../../contexts/shared/infrastructure/http/HttpNextResponse";
import { customerToJson, handleAuthDomainError } from "../../../../../lib/auth/http";
import { requireCustomerSession } from "../../../../../lib/auth/requireCustomerSession";

export const dynamic = "force-dynamic";

type Body = {
	rewardId?: string;
};

export async function POST(request: Request): Promise<Response> {
	const auth = await requireCustomerSession(request);
	if (auth instanceof NextResponse) {
		return auth;
	}

	const body = (await request.json()) as Body;
	const rewardId = body.rewardId?.trim();

	if (!rewardId) {
		return NextResponse.json({ error: { description: "rewardId is required" } }, { status: 400 });
	}

	try {
		const result = await container.get(RedeemCustomerReward).execute({
			tenantId: auth.session.tenantId,
			customerId: auth.customer.id,
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
