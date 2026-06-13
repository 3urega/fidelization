import "reflect-metadata";

import { NextResponse } from "next/server";

import { CreateStampCampaignFromPlatformTemplate } from "../../../../../contexts/loyalty/stamp_campaigns/application/adopt/CreateStampCampaignFromPlatformTemplate";
import { PlatformCampaignTemplateNotFound } from "../../../../../contexts/platform/domain/PlatformCampaignTemplateNotFound";
import { DomainError } from "../../../../../contexts/shared/domain/DomainError";
import { container } from "../../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { HttpNextResponse } from "../../../../../contexts/shared/infrastructure/http/HttpNextResponse";
import { TenantNotFound } from "../../../../../contexts/tenants/tenants/domain/TenantNotFound";
import { TenantRole } from "../../../../../contexts/tenants/memberships/domain/TenantRole";
import { handleAuthDomainError, stampCampaignToJson } from "../../../../../lib/auth/http";
import { requireTenantSession } from "../../../../../lib/auth/requireTenantSession";

export const dynamic = "force-dynamic";

type Body = {
	templateId?: string;
	stampTypeId?: string;
};

export async function POST(request: Request): Promise<Response> {
	const auth = await requireTenantSession(request);
	if (auth instanceof NextResponse) {
		return auth;
	}

	const body = (await request.json()) as Body;
	const templateId = body.templateId?.trim();
	const stampTypeId = body.stampTypeId?.trim();

	if (!templateId || !stampTypeId) {
		return NextResponse.json(
			{ error: { description: "templateId and stampTypeId are required" } },
			{ status: 400 },
		);
	}

	try {
		const campaign = await container.get(CreateStampCampaignFromPlatformTemplate).execute({
			tenantId: auth.session.tenantId,
			role: auth.session.role as TenantRole,
			templateId,
			stampTypeId,
		});

		return NextResponse.json({ campaign: stampCampaignToJson(campaign) }, { status: 201 });
	} catch (error) {
		if (error instanceof DomainError) {
			const response = handleAuthDomainError(error);
			if (response) {
				return response;
			}
		}

		if (error instanceof PlatformCampaignTemplateNotFound) {
			return HttpNextResponse.domainError(error, 404);
		}

		if (error instanceof TenantNotFound) {
			return HttpNextResponse.domainError(error, 404);
		}

		throw error;
	}
}
