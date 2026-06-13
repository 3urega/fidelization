import "reflect-metadata";

import { NextResponse } from "next/server";

import type { TenantFeatureOverrides } from "../../../../../../contexts/billing/subscriptions/domain/TenantFeatureOverrides";
import {
	GetPlatformTenantFeatures,
	UpdatePlatformTenantFeatures,
} from "../../../../../../contexts/platform/application/features/PlatformTenantFeatures";
import { container } from "../../../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { HttpNextResponse } from "../../../../../../contexts/shared/infrastructure/http/HttpNextResponse";
import { TenantNotFound } from "../../../../../../contexts/tenants/tenants/domain/TenantNotFound";
import { requirePlatformSession } from "../../../../../../lib/auth/requirePlatformSession";
import { platformTenantFeaturesToJson } from "../../../../../../lib/platform/features";
import { getResolvedTenantFromRequest } from "../../../../../../lib/tenant/getResolvedTenant";

export const dynamic = "force-dynamic";

type PatchBody = {
	overrides?: TenantFeatureOverrides | null;
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
		const view = await container
			.get(GetPlatformTenantFeatures)
			.execute(context.params.tenantId);

		return NextResponse.json(platformTenantFeaturesToJson(view));
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

	let body: PatchBody;
	try {
		body = (await request.json()) as PatchBody;
	} catch {
		return NextResponse.json({ error: { description: "Invalid JSON body" } }, { status: 400 });
	}

	if (body.overrides === undefined) {
		return NextResponse.json({ error: { description: "overrides required" } }, { status: 400 });
	}

	try {
		const view = await container.get(UpdatePlatformTenantFeatures).execute({
			tenantId: context.params.tenantId,
			overrides: body.overrides,
		});

		return NextResponse.json(platformTenantFeaturesToJson(view));
	} catch (error) {
		if (error instanceof TenantNotFound) {
			return HttpNextResponse.domainError(error, 404);
		}

		throw error;
	}
}
