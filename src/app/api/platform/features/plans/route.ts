import "reflect-metadata";

import { NextResponse } from "next/server";

import type { SubscriptionPlanFeatures } from "../../../../../contexts/billing/subscriptions/domain/SubscriptionPlanFeatures";
import { SubscriptionPlanNotFound } from "../../../../../contexts/billing/subscriptions/domain/SubscriptionPlanNotFound";
import {
	ListPlatformPlanFeatures,
	UpdatePlatformPlanFeatures,
} from "../../../../../contexts/platform/application/features/PlatformPlanFeatures";
import { container } from "../../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { HttpNextResponse } from "../../../../../contexts/shared/infrastructure/http/HttpNextResponse";
import { subscriptionPlanToJson } from "../../../../../lib/auth/http";
import { requirePlatformSession } from "../../../../../lib/auth/requirePlatformSession";
import { platformPlanFeaturesToJson } from "../../../../../lib/platform/features";
import { getResolvedTenantFromRequest } from "../../../../../lib/tenant/getResolvedTenant";

export const dynamic = "force-dynamic";

type PatchBody = {
	planId?: string;
	features?: SubscriptionPlanFeatures;
};

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

	const result = await container.get(ListPlatformPlanFeatures).execute();

	return NextResponse.json(platformPlanFeaturesToJson(result));
}

export async function PATCH(request: Request): Promise<Response> {
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

	if (!body.planId?.trim() || !body.features) {
		return NextResponse.json(
			{ error: { description: "planId and features required" } },
			{ status: 400 },
		);
	}

	try {
		const plan = await container.get(UpdatePlatformPlanFeatures).execute({
			planId: body.planId.trim(),
			features: body.features,
		});

		return NextResponse.json({ plan: subscriptionPlanToJson(plan) });
	} catch (error) {
		if (error instanceof SubscriptionPlanNotFound) {
			return HttpNextResponse.domainError(error, 404);
		}

		throw error;
	}
}
