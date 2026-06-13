import "reflect-metadata";

import { NextResponse } from "next/server";

import { ListPlatformCampaignTemplates } from "../../../../contexts/platform/application/campaign_templates/ListPlatformCampaignTemplates";
import { container } from "../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { TenantNotFound } from "../../../../contexts/tenants/tenants/domain/TenantNotFound";
import { TenantRole } from "../../../../contexts/tenants/memberships/domain/TenantRole";
import { DomainError } from "../../../../contexts/shared/domain/DomainError";
import { HttpNextResponse } from "../../../../contexts/shared/infrastructure/http/HttpNextResponse";
import { handleAuthDomainError } from "../../../../lib/auth/http";
import { requireTenantSession } from "../../../../lib/auth/requireTenantSession";
import { platformCampaignTemplatesToJson } from "../../../../lib/platform/campaignTemplates";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
	const auth = await requireTenantSession(request);
	if (auth instanceof NextResponse) {
		return auth;
	}

	try {
		const templates = await container.get(ListPlatformCampaignTemplates).execute({
			activeOnly: true,
		});

		return NextResponse.json(platformCampaignTemplatesToJson(templates));
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
