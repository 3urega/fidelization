import "reflect-metadata";

import { NextResponse } from "next/server";

import { AssignPlatformTenantSubscriptionPlan } from "../../../../../contexts/platform/application/tenants/AssignPlatformTenantSubscriptionPlan";
import { GetPlatformTenantDetail } from "../../../../../contexts/platform/application/tenants/GetPlatformTenantDetail";
import { UpdatePlatformTenant } from "../../../../../contexts/platform/application/tenants/UpdatePlatformTenant";
import { DomainError } from "../../../../../contexts/shared/domain/DomainError";
import { container } from "../../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { HttpNextResponse } from "../../../../../contexts/shared/infrastructure/http/HttpNextResponse";
import { SubscriptionPlanNotFound } from "../../../../../contexts/billing/subscriptions/domain/SubscriptionPlanNotFound";
import { TenantNotFound } from "../../../../../contexts/tenants/tenants/domain/TenantNotFound";
import { TenantSlugAlreadyExists } from "../../../../../contexts/tenants/tenants/domain/TenantSlugAlreadyExists";
import { platformTenantDetailToJson } from "../../../../../lib/auth/http";
import { requirePlatformSession } from "../../../../../lib/auth/requirePlatformSession";
import { getResolvedTenantFromRequest } from "../../../../../lib/tenant/getResolvedTenant";

export const dynamic = "force-dynamic";

type PatchBody = {
	name?: string;
	slug?: string;
	planId?: string;
};

export async function GET(
	request: Request,
	context: { params: { tenantId: string } },
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

	try {
		const detail = await container.get(GetPlatformTenantDetail).execute(context.params.tenantId);

		return NextResponse.json(platformTenantDetailToJson(detail));
	} catch (error) {
		if (error instanceof TenantNotFound) {
			return HttpNextResponse.domainError(error, 404);
		}

		throw error;
	}
}

export async function PATCH(
	request: Request,
	context: { params: { tenantId: string } },
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

	const body = (await request.json()) as PatchBody;
	const tenantId = context.params.tenantId;

	try {
		if (body.name !== undefined || body.slug !== undefined) {
			await container.get(UpdatePlatformTenant).execute({
				tenantId,
				name: body.name,
				slug: body.slug,
			});
		}

		if (body.planId?.trim()) {
			await container.get(AssignPlatformTenantSubscriptionPlan).execute({
				tenantId,
				planId: body.planId.trim(),
			});
		}

		const detail = await container.get(GetPlatformTenantDetail).execute(tenantId);

		return NextResponse.json(platformTenantDetailToJson(detail));
	} catch (error) {
		if (error instanceof DomainError) {
			if (error instanceof TenantSlugAlreadyExists) {
				return HttpNextResponse.domainError(error, 409);
			}

			if (error instanceof TenantNotFound || error instanceof SubscriptionPlanNotFound) {
				return HttpNextResponse.domainError(error, 404);
			}
		}

		if (error instanceof Error && error.message === "name cannot be empty") {
			return NextResponse.json({ error: { description: error.message } }, { status: 400 });
		}

		throw error;
	}
}
