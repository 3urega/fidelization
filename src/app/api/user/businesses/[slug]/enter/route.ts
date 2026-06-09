import "reflect-metadata";

import { NextResponse } from "next/server";

import { EnterTenantStaffFromUserSession } from "../../../../../../contexts/tenants/memberships/application/authenticate/EnterTenantStaffFromUserSession";
import { StaffMembershipNotFound } from "../../../../../../contexts/tenants/memberships/domain/StaffMembershipNotFound";
import { TenantAccessSuspended } from "../../../../../../contexts/tenants/tenants/domain/TenantAccessSuspended";
import { TenantNotFound } from "../../../../../../contexts/tenants/tenants/domain/TenantNotFound";
import { PlatformUserCannotUseTenantLogin } from "../../../../../../contexts/platform/domain/PlatformUserCannotUseTenantLogin";
import { container } from "../../../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { authResponseToJson, handleAuthDomainError } from "../../../../../../lib/auth/http";
import { createSessionToken, jsonWithSessionCookie } from "../../../../../../lib/auth/session";
import { requireUserSession } from "../../../../../../lib/auth/requireUserSession";
import { getResolvedTenantFromRequest } from "../../../../../../lib/tenant/getResolvedTenant";
import { resolveTenantHomeUrl } from "../../../../../../lib/tenant/resolveTenantHomeUrl";

type RouteContext = {
	params: { slug: string };
};

function rejectIfTenantHost(request: Request): NextResponse | null {
	if (getResolvedTenantFromRequest(request)) {
		return NextResponse.json(
			{
				error: {
					description:
						"Entering the business panel from the platform app is only available on the apex host.",
				},
			},
			{ status: 403 },
		);
	}

	return null;
}

export async function POST(request: Request, context: RouteContext): Promise<Response> {
	const tenantHostError = rejectIfTenantHost(request);
	if (tenantHostError) {
		return tenantHostError;
	}

	try {
		const auth = await requireUserSession(request);
		if (auth instanceof NextResponse) {
			return auth;
		}

		const slug = context.params.slug?.trim() ?? "";
		if (!slug) {
			return NextResponse.json({ error: { description: "slug is required" } }, { status: 400 });
		}

		const result = await container.get(EnterTenantStaffFromUserSession).enter({
			userId: auth.session.userId,
			tenantSlug: slug,
		});

		const session = {
			kind: "tenant" as const,
			userId: result.user.id.value,
			tenantId: result.membership.tenant.id,
			role: result.membership.role,
		};
		const token = await createSessionToken(session);

		return jsonWithSessionCookie(
			{
				...authResponseToJson(result.user, result.membership.tenant, session),
				redirectUrl: resolveTenantHomeUrl(result.membership.tenant.slug),
			},
			token,
		);
	} catch (error) {
		if (
			error instanceof StaffMembershipNotFound ||
			error instanceof PlatformUserCannotUseTenantLogin ||
			error instanceof TenantAccessSuspended ||
			error instanceof TenantNotFound
		) {
			const response = handleAuthDomainError(error);

			if (response) {
				return response;
			}
		}

		throw error;
	}
}
