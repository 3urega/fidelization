import "reflect-metadata";

import { NextResponse } from "next/server";

import { RegisterCustomer } from "../../../../../contexts/loyalty/customers/application/register/RegisterCustomer";
import { DomainError } from "../../../../../contexts/shared/domain/DomainError";
import { container } from "../../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { HttpNextResponse } from "../../../../../contexts/shared/infrastructure/http/HttpNextResponse";
import { TenantNotFound } from "../../../../../contexts/tenants/tenants/domain/TenantNotFound";
import {
	customerAuthResponseToJson,
	handleAuthDomainError,
} from "../../../../../lib/auth/http";
import { createSessionToken, jsonWithSessionCookie } from "../../../../../lib/auth/session";
import { requireResolvedTenant } from "../../../../../lib/tenant/requireResolvedTenant";

export const dynamic = "force-dynamic";

type Body = {
	name?: string;
	email?: string;
	phone?: string;
};

export async function POST(request: Request): Promise<Response> {
	const hostTenant = requireResolvedTenant(request);
	if (hostTenant instanceof NextResponse) {
		return hostTenant;
	}

	const body = (await request.json()) as Body;
	if (!body.name?.trim()) {
		return NextResponse.json({ error: { description: "name is required" } }, { status: 400 });
	}

	try {
		const customer = await container.get(RegisterCustomer).execute({
			tenantId: hostTenant.tenantId,
			name: body.name,
			email: body.email,
			phone: body.phone,
		});

		const session = {
			kind: "customer" as const,
			customerId: customer.id,
			tenantId: hostTenant.tenantId,
		};
		const token = await createSessionToken(session);

		return jsonWithSessionCookie(customerAuthResponseToJson(customer, session), token, 201);
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
