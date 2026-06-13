import "reflect-metadata";

import { NextResponse } from "next/server";

import { UpdateSubscriptionPlan } from "../../../../../contexts/billing/subscriptions/application/update/UpdateSubscriptionPlan";
import type { SubscriptionPlanFeatures } from "../../../../../contexts/billing/subscriptions/domain/SubscriptionPlanFeatures";
import { SubscriptionPlanNotFound } from "../../../../../contexts/billing/subscriptions/domain/SubscriptionPlanNotFound";
import { container } from "../../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { HttpNextResponse } from "../../../../../contexts/shared/infrastructure/http/HttpNextResponse";
import { subscriptionPlanToJson } from "../../../../../lib/auth/http";
import { requirePlatformSession } from "../../../../../lib/auth/requirePlatformSession";
import { getResolvedTenantFromRequest } from "../../../../../lib/tenant/getResolvedTenant";

export const dynamic = "force-dynamic";

type PatchBody = {
	priceMonthly?: number;
	priceYearly?: number;
	features?: SubscriptionPlanFeatures;
	limits?: { employees?: number } | null;
	isActive?: boolean;
};

export async function PATCH(
	request: Request,
	context: { params: { planId: string } },
): Promise<Response> {
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

	let body: PatchBody;
	try {
		body = (await request.json()) as PatchBody;
	} catch {
		return NextResponse.json({ error: { description: "Invalid JSON body" } }, { status: 400 });
	}

	try {
		const plan = await container.get(UpdateSubscriptionPlan).execute({
			planId: context.params.planId,
			priceMonthly: body.priceMonthly,
			priceYearly: body.priceYearly,
			features: body.features,
			limits: body.limits,
			isActive: body.isActive,
		});

		return NextResponse.json({ plan: subscriptionPlanToJson(plan) });
	} catch (error) {
		if (error instanceof SubscriptionPlanNotFound) {
			return HttpNextResponse.domainError(error, 404);
		}

		if (error instanceof Error && error.message.includes("must be")) {
			return NextResponse.json({ error: { description: error.message } }, { status: 400 });
		}

		throw error;
	}
}
