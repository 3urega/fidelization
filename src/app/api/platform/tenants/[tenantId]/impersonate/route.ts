import "reflect-metadata";

import { NextResponse } from "next/server";

import { ImpersonateTenantOwnerFromPlatformSession } from "../../../../../../contexts/platform/application/impersonation/ImpersonateTenantOwnerFromPlatformSession";
import { TenantHasNoOwner } from "../../../../../../contexts/platform/domain/TenantHasNoOwner";
import { container } from "../../../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { HttpNextResponse } from "../../../../../../contexts/shared/infrastructure/http/HttpNextResponse";
import { TenantNotFound } from "../../../../../../contexts/tenants/tenants/domain/TenantNotFound";
import { TenantRole } from "../../../../../../contexts/tenants/memberships/domain/TenantRole";
import { authResponseToJson } from "../../../../../../lib/auth/http";
import { requirePlatformSession } from "../../../../../../lib/auth/requirePlatformSession";
import { createSessionToken, jsonWithSessionCookie } from "../../../../../../lib/auth/session";
import { getResolvedTenantFromRequest } from "../../../../../../lib/tenant/getResolvedTenant";
import { resolveTenantPanelRedirectUrl } from "../../../../../../lib/tenant/resolveTenantPanelRedirectUrl";

export const dynamic = "force-dynamic";

export async function POST(
	request: Request,
	context: { params: { tenantId: string } },
): Promise<Response> {
	if (getResolvedTenantFromRequest(request)) {
		return NextResponse.json(
			{ error: { description: "Forbidden on business subdomain" } },
			{ status: 403 },
		);
	}

	const auth = await requirePlatformSession(request);
	if (auth instanceof NextResponse) {
		return auth;
	}

	try {
		const result = await container.get(ImpersonateTenantOwnerFromPlatformSession).execute({
			platformUserId: auth.session.userId,
			tenantId: context.params.tenantId,
		});

		const session = {
			kind: "tenant" as const,
			userId: result.user.id.value,
			tenantId: result.membership.tenant.id,
			role: TenantRole.Owner,
			impersonatedBy: auth.session.userId,
		};
		const token = await createSessionToken(session);
		const redirectUrl = resolveTenantPanelRedirectUrl(request, result.membership.tenant.slug);

		return jsonWithSessionCookie(
			{
				...authResponseToJson(result.user, result.membership.tenant, session),
				redirectUrl,
				impersonating: true,
			},
			token,
		);
	} catch (error) {
		if (error instanceof TenantNotFound || error instanceof TenantHasNoOwner) {
			return HttpNextResponse.domainError(error, 404);
		}

		throw error;
	}
}
