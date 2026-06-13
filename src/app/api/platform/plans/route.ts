import "reflect-metadata";

import { NextResponse } from "next/server";

import { ListPlatformSubscriptionPlans } from "../../../../contexts/billing/subscriptions/application/list/ListPlatformSubscriptionPlans";
import { container } from "../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { subscriptionPlanToJson } from "../../../../lib/auth/http";
import { requirePlatformSession } from "../../../../lib/auth/requirePlatformSession";
import { getResolvedTenantFromRequest } from "../../../../lib/tenant/getResolvedTenant";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
	if (getResolvedTenantFromRequest(request)) {
		return NextResponse.json(
			{ error: { description: "Forbidden on business subdomain" } },
			{ status: 403 },
		);
	}

	const auth = await requirePlatformSession(request);
	if (auth instanceof NextResponse) {
		return auth;
	}

	const plans = await container.get(ListPlatformSubscriptionPlans).execute();

	return NextResponse.json({
		plans: plans.map((plan) => subscriptionPlanToJson(plan)),
	});
}
