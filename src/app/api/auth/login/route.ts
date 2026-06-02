import "reflect-metadata";

import { NextResponse } from "next/server";

import { InvalidCredentials } from "../../../../contexts/identity/users/domain/InvalidCredentials";
import { PlatformUserCannotUseTenantLogin } from "../../../../contexts/platform/domain/PlatformUserCannotUseTenantLogin";
import { container } from "../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { TenantStaffLogin } from "../../../../contexts/tenants/memberships/application/authenticate/TenantStaffLogin";
import { StaffMembershipNotFound } from "../../../../contexts/tenants/memberships/domain/StaffMembershipNotFound";
import { TenantAccessSuspended } from "../../../../contexts/tenants/tenants/domain/TenantAccessSuspended";
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
		const result = await container
			.get(TenantStaffLogin)
			.loginWithPassword(body.email, body.password, hostTenant?.tenantId ?? null);

		const session = {
			kind: "tenant" as const,
			userId: result.user.id.value,
			tenantId: result.membership.tenant.id,
			role: result.membership.role,
		};
		const token = await createSessionToken(session);

		return jsonWithSessionCookie(
			authResponseToJson(result.user, result.membership.tenant, session),
			token,
		);
	} catch (error) {
		if (
			error instanceof InvalidCredentials ||
			error instanceof StaffMembershipNotFound ||
			error instanceof PlatformUserCannotUseTenantLogin ||
			error instanceof TenantAccessSuspended
		) {
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
