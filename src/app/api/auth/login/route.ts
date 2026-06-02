import "reflect-metadata";

import { NextResponse } from "next/server";

import { InvalidCredentials } from "../../../../contexts/identity/users/domain/InvalidCredentials";
import { TenantStaffLogin } from "../../../../contexts/tenants/memberships/application/authenticate/TenantStaffLogin";
import { StaffMembershipNotFound } from "../../../../contexts/tenants/memberships/domain/StaffMembershipNotFound";
import { container } from "../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { authResponseToJson, handleAuthDomainError } from "../../../../lib/auth/http";
import { createSessionToken, jsonWithSessionCookie } from "../../../../lib/auth/session";
import { getResolvedTenantFromRequest } from "../../../../lib/tenant/getResolvedTenant";

type Body = {
	email: string;
	password: string;
};

export async function POST(request: Request): Promise<Response> {
	try {
		const body = (await request.json()) as Body;
		if (!body.email || !body.password) {
			return NextResponse.json(
				{ error: { description: "email and password are required" } },
				{ status: 400 },
			);
		}

		const hostTenant = getResolvedTenantFromRequest(request);
		const result = await container.get(TenantStaffLogin).loginWithPassword(
			body.email,
			body.password,
			hostTenant?.tenantId ?? null,
		);

		const session = {
			userId: result.user.id.value,
			tenantId: result.membership.tenant.id,
			role: result.membership.role,
		};
		const token = await createSessionToken(session);

		return jsonWithSessionCookie(authResponseToJson(result.user, result.membership.tenant, session), token);
	} catch (error) {
		if (error instanceof InvalidCredentials || error instanceof StaffMembershipNotFound) {
			const response = handleAuthDomainError(error);

			if (response) {
				return response;
			}
		}

		if (error instanceof Error && error.message.includes("AUTH_SECRET")) {
			return NextResponse.json({ error: { description: error.message } }, { status: 500 });
		}

		throw error;
	}
}
