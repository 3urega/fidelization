import "reflect-metadata";

import { NextResponse } from "next/server";

import { JoinTenantAsCustomer } from "../../../../../contexts/loyalty/customers/application/join/JoinTenantAsCustomer";
import { DomainError } from "../../../../../contexts/shared/domain/DomainError";
import { container } from "../../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { HttpNextResponse } from "../../../../../contexts/shared/infrastructure/http/HttpNextResponse";
import { TenantNotFound } from "../../../../../contexts/tenants/tenants/domain/TenantNotFound";
import { customerToJson, handleAuthDomainError } from "../../../../../lib/auth/http";
import { requireUserSession } from "../../../../../lib/auth/requireUserSession";
import { getResolvedTenantFromRequest } from "../../../../../lib/tenant/getResolvedTenant";

type Body = {
	slug?: string;
};

function rejectIfTenantHost(request: Request): NextResponse | null {
	if (getResolvedTenantFromRequest(request)) {
		return NextResponse.json(
			{
				error: {
					description:
						"Establishment join is only available on the apex host (no business subdomain).",
				},
			},
			{ status: 403 },
		);
	}

	return null;
}

export async function POST(request: Request): Promise<Response> {
	const tenantHostError = rejectIfTenantHost(request);
	if (tenantHostError) {
		return tenantHostError;
	}

	try {
		const auth = await requireUserSession(request);
		if (auth instanceof NextResponse) {
			return auth;
		}

		const body = (await request.json()) as Body;
		const slug = body.slug?.trim() ?? "";

		if (!slug) {
			return NextResponse.json({ error: { description: "slug is required" } }, { status: 400 });
		}

		const result = await container.get(JoinTenantAsCustomer).execute({
			userId: auth.session.userId,
			slug,
		});

		return NextResponse.json(
			{
				customer: customerToJson(result.customer),
				tenantId: result.customer.tenantId,
				created: result.created,
			},
			{ status: result.created ? 201 : 200 },
		);
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
