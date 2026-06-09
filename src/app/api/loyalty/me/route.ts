import "reflect-metadata";

import { NextResponse } from "next/server";

import { GetCustomerActiveRewards } from "../../../../contexts/loyalty/customers/application/profile/GetCustomerActiveRewards";
import { GetCustomerStampProgress } from "../../../../contexts/loyalty/customers/application/profile/GetCustomerStampProgress";
import { ListActivePromotionsForCustomer } from "../../../../contexts/loyalty/promotions/application/list/ListActivePromotionsForCustomer";
import { DomainError } from "../../../../contexts/shared/domain/DomainError";
import { container } from "../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { TenantNotFound } from "../../../../contexts/tenants/tenants/domain/TenantNotFound";
import { HttpNextResponse } from "../../../../contexts/shared/infrastructure/http/HttpNextResponse";
import {
	customerToJson,
	handleAuthDomainError,
	promotionToJson,
	rewardToJson,
	stampProgressToJson,
} from "../../../../lib/auth/http";
import { requireCustomerSession } from "../../../../lib/auth/requireCustomerSession";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
	const auth = await requireCustomerSession(request);
	if (auth instanceof NextResponse) {
		return auth;
	}

	try {
		const [stampProgress, rewards, promotions] = await Promise.all([
			container.get(GetCustomerStampProgress).execute({
				tenantId: auth.session.tenantId,
				customerId: auth.customer.id,
			}),
			container.get(GetCustomerActiveRewards).execute({
				tenantId: auth.session.tenantId,
			}),
			container.get(ListActivePromotionsForCustomer).execute({
				tenantId: auth.session.tenantId,
			}),
		]);

		return NextResponse.json({
			customer: customerToJson(auth.customer),
			stampProgress: stampProgress.map((summary) => stampProgressToJson(summary)),
			rewards: rewards.map((reward) => rewardToJson(reward)),
			promotions: promotions.map((promotion) => promotionToJson(promotion)),
			kind: auth.session.kind,
			tenantId: auth.session.tenantId,
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
