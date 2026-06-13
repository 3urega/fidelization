import "reflect-metadata";

import { NextResponse } from "next/server";

import { ListTenantCustomersBySegment } from "../../../../contexts/loyalty/customers/application/analytics/ListTenantCustomersBySegment";
import { DomainError } from "../../../../contexts/shared/domain/DomainError";
import { container } from "../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { HttpNextResponse } from "../../../../contexts/shared/infrastructure/http/HttpNextResponse";
import { TenantRole } from "../../../../contexts/tenants/memberships/domain/TenantRole";
import { TenantNotFound } from "../../../../contexts/tenants/tenants/domain/TenantNotFound";
import { customerZoneListToJson, handleAuthDomainError } from "../../../../lib/auth/http";
import { requireTenantSession } from "../../../../lib/auth/requireTenantSession";
import { parseCustomerSegment } from "../../../../lib/loyalty/parseCustomerSegment";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
	const auth = await requireTenantSession(request);
	if (auth instanceof NextResponse) {
		return auth;
	}

	const segment = parseCustomerSegment(new URL(request.url).searchParams.get("segment"));
	if (!segment) {
		return NextResponse.json(
			{
				error: {
					type: "InvalidCustomerZoneSegment",
					message:
						"Query segment is required and must be one of: featured, at_risk, near_reward, all",
				},
			},
			{ status: 400 },
		);
	}

	try {
		const result = await container.get(ListTenantCustomersBySegment).execute({
			tenantId: auth.session.tenantId,
			role: auth.session.role as TenantRole,
			segment,
		});

		return NextResponse.json(customerZoneListToJson(result));
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
