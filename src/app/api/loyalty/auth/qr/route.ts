import "reflect-metadata";

import { NextResponse } from "next/server";

import { AuthenticateCustomerByQr } from "../../../../../contexts/loyalty/customers/application/authenticate/AuthenticateCustomerByQr";
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
	qrValue?: string;
};

export async function POST(request: Request): Promise<Response> {
	const hostTenant = requireResolvedTenant(request);
	if (hostTenant instanceof NextResponse) {
		return hostTenant;
	}

	const body = (await request.json()) as Body;
	if (!body.qrValue?.trim()) {
		return NextResponse.json({ error: { description: "qrValue is required" } }, { status: 400 });
	}

	try {
		const customer = await container.get(AuthenticateCustomerByQr).execute({
			tenantId: hostTenant.tenantId,
			qrValue: body.qrValue,
		});

		const session = {
			kind: "customer" as const,
			customerId: customer.id,
			tenantId: hostTenant.tenantId,
		};
		const token = await createSessionToken(session);

		return jsonWithSessionCookie(customerAuthResponseToJson(customer, session), token);
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
