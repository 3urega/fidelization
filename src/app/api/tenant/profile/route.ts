import "reflect-metadata";

import { NextResponse } from "next/server";

import { DomainError } from "../../../../contexts/shared/domain/DomainError";
import { container } from "../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { HttpNextResponse } from "../../../../contexts/shared/infrastructure/http/HttpNextResponse";
import { UpdateTenantProfile } from "../../../../contexts/tenants/tenants/application/update/UpdateTenantProfile";
import { TenantNotFound } from "../../../../contexts/tenants/tenants/domain/TenantNotFound";
import { TenantProfileUpdateInput } from "../../../../contexts/tenants/tenants/domain/TenantProfileUpdate";
import { TenantRole } from "../../../../contexts/tenants/memberships/domain/TenantRole";
import { handleAuthDomainError, tenantToJson } from "../../../../lib/auth/http";
import { requireTenantSession } from "../../../../lib/auth/requireTenantSession";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request): Promise<Response> {
	const auth = await requireTenantSession(request);
	if (auth instanceof NextResponse) {
		return auth;
	}

	const body = (await request.json()) as TenantProfileUpdateInput;

	try {
		const tenant = await container.get(UpdateTenantProfile).execute({
			tenantId: auth.session.tenantId,
			role: auth.session.role as TenantRole,
			profile: body,
		});

		return NextResponse.json({ tenant: tenantToJson(tenant) });
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
