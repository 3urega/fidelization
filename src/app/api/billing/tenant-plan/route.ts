import "reflect-metadata";

import { NextResponse } from "next/server";

import { AssignTenantSubscriptionPlan } from "../../../../contexts/billing/subscriptions/application/assign/AssignTenantSubscriptionPlan";
import { DomainError } from "../../../../contexts/shared/domain/DomainError";
import { container } from "../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { HttpNextResponse } from "../../../../contexts/shared/infrastructure/http/HttpNextResponse";
import { SubscriptionPlanNotFound } from "../../../../contexts/billing/subscriptions/domain/SubscriptionPlanNotFound";
import { TenantNotFound } from "../../../../contexts/tenants/tenants/domain/TenantNotFound";
import { TenantRole } from "../../../../contexts/tenants/memberships/domain/TenantRole";
import {
	handleAuthDomainError,
	subscriptionPlanToJson,
	tenantToJson,
} from "../../../../lib/auth/http";
import { requireTenantSession } from "../../../../lib/auth/requireTenantSession";

export const dynamic = "force-dynamic";

type Body = {
	planId?: string;
};

export async function PATCH(request: Request): Promise<Response> {
	const auth = await requireTenantSession(request);
	if (auth instanceof NextResponse) {
		return auth;
	}

	const body = (await request.json()) as Body;
	if (!body.planId?.trim()) {
		return NextResponse.json({ error: { description: "planId is required" } }, { status: 400 });
	}

	try {
		const result = await container.get(AssignTenantSubscriptionPlan).execute({
			tenantId: auth.session.tenantId,
			role: auth.session.role as TenantRole,
			planId: body.planId,
		});

		return NextResponse.json({
			tenant: tenantToJson(result.tenant),
			plan: subscriptionPlanToJson(result.plan),
		});
	} catch (error) {
		if (error instanceof DomainError) {
			const response = handleAuthDomainError(error);
			if (response) {
				return response;
			}
		}

		if (error instanceof TenantNotFound || error instanceof SubscriptionPlanNotFound) {
			return HttpNextResponse.domainError(error, 404);
		}

		throw error;
	}
}
