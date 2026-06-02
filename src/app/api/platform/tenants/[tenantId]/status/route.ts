import "reflect-metadata";

import { NextResponse } from "next/server";

import { SetTenantPlatformStatus } from "../../../../../../contexts/platform/application/tenants/SetTenantPlatformStatus";
import { container } from "../../../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { HttpNextResponse } from "../../../../../../contexts/shared/infrastructure/http/HttpNextResponse";
import { TenantNotFound } from "../../../../../../contexts/tenants/tenants/domain/TenantNotFound";
import { TenantStatus } from "../../../../../../contexts/tenants/tenants/domain/TenantStatus";
import { platformTenantToJson } from "../../../../../../lib/auth/http";
import { requirePlatformSession } from "../../../../../../lib/auth/requirePlatformSession";
import { getResolvedTenantFromRequest } from "../../../../../../lib/tenant/getResolvedTenant";

export const dynamic = "force-dynamic";

type Body = {
	status?: string;
};

function parseStatus(value: string | undefined): TenantStatus | null {
	if (value === TenantStatus.Active || value === TenantStatus.Suspended) {
		return value;
	}

	return null;
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

	const body = (await request.json()) as Body;
	const status = parseStatus(body.status?.trim());

	if (!status) {
		return NextResponse.json(
			{ error: { description: 'status must be "active" or "suspended"' } },
			{ status: 400 },
		);
	}

	try {
		const tenant = await container
			.get(SetTenantPlatformStatus)
			.execute(context.params.tenantId, status);

		return NextResponse.json({ tenant: platformTenantToJson(tenant) });
	} catch (error) {
		if (error instanceof TenantNotFound) {
			return HttpNextResponse.domainError(error, 404);
		}

		throw error;
	}
}
