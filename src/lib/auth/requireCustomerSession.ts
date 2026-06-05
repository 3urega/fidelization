import { NextResponse } from "next/server";

import { Customer } from "../../contexts/loyalty/customers/domain/Customer";
import { container } from "../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { CustomerSessionVerifier } from "../../contexts/loyalty/customers/application/verify/CustomerSessionVerifier";
import { CrossTenantAccessDenied } from "../../contexts/tenants/memberships/domain/CrossTenantAccessDenied";
import { InvalidCustomerSession } from "../../contexts/loyalty/customers/domain/InvalidCustomerSession";
import { TenantAccessSuspended } from "../../contexts/tenants/tenants/domain/TenantAccessSuspended";
import { getResolvedTenantFromRequest } from "../tenant/getResolvedTenant";
import {
	getAuthenticatedSession,
	isCustomerSession,
	type CustomerSessionClaims,
} from "./session";

export type CustomerSessionContext = {
	session: CustomerSessionClaims;
	customer: Customer;
};

export async function requireCustomerSession(
	request: Request,
): Promise<CustomerSessionContext | NextResponse> {
	const session = await getAuthenticatedSession(request);

	if (!session || !isCustomerSession(session)) {
		return NextResponse.json({ error: { description: "Unauthorized" } }, { status: 401 });
	}

	const hostTenant = getResolvedTenantFromRequest(request);

	try {
		const customer = await container
			.get(CustomerSessionVerifier)
			.verify(session, hostTenant?.tenantId);

		return { session, customer };
	} catch (error) {
		if (error instanceof CrossTenantAccessDenied) {
			return NextResponse.json({ error: { description: error.message } }, { status: 403 });
		}

		if (error instanceof InvalidCustomerSession) {
			return NextResponse.json({ error: { description: error.message } }, { status: 401 });
		}

		if (error instanceof TenantAccessSuspended) {
			return NextResponse.json({ error: { description: error.message } }, { status: 403 });
		}

		throw error;
	}
}
