import "reflect-metadata";

import { NextResponse } from "next/server";

import { ListStampCampaignDashboard } from "../../../../../contexts/loyalty/stamp_campaigns/application/dashboard/ListStampCampaignDashboard";
import { DomainError } from "../../../../../contexts/shared/domain/DomainError";
import { container } from "../../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { HttpNextResponse } from "../../../../../contexts/shared/infrastructure/http/HttpNextResponse";
import { TenantRole } from "../../../../../contexts/tenants/memberships/domain/TenantRole";
import { TenantNotFound } from "../../../../../contexts/tenants/tenants/domain/TenantNotFound";
import { handleAuthDomainError, stampCampaignDashboardToJson } from "../../../../../lib/auth/http";
import { requireTenantSession } from "../../../../../lib/auth/requireTenantSession";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
	const auth = await requireTenantSession(request);
	if (auth instanceof NextResponse) {
		return auth;
	}

	try {
		const result = await container.get(ListStampCampaignDashboard).execute({
			tenantId: auth.session.tenantId,
			role: auth.session.role as TenantRole,
		});

		return NextResponse.json(stampCampaignDashboardToJson(result));
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
