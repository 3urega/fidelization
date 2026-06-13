import "reflect-metadata";

import { NextResponse } from "next/server";

import { GetTenantCustomerDetail } from "../../../../../contexts/loyalty/customers/application/analytics/GetTenantCustomerDetail";
import { DomainError } from "../../../../../contexts/shared/domain/DomainError";
import { container } from "../../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { HttpNextResponse } from "../../../../../contexts/shared/infrastructure/http/HttpNextResponse";
import { TenantRole } from "../../../../../contexts/tenants/memberships/domain/TenantRole";
import { TenantNotFound } from "../../../../../contexts/tenants/tenants/domain/TenantNotFound";
import { customerZoneDetailToJson, handleAuthDomainError } from "../../../../../lib/auth/http";
import { requireTenantSession } from "../../../../../lib/auth/requireTenantSession";

export const dynamic = "force-dynamic";

type RouteContext = {
	params: {
		id: string;
	};
};

export async function GET(request: Request, context: RouteContext): Promise<Response> {
	const auth = await requireTenantSession(request);
	if (auth instanceof NextResponse) {
		return auth;
	}

	try {
		const result = await container.get(GetTenantCustomerDetail).execute({
			tenantId: auth.session.tenantId,
			customerId: context.params.id,
			role: auth.session.role as TenantRole,
		});

		return NextResponse.json(customerZoneDetailToJson(result));
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
