import "reflect-metadata";

import { NextResponse } from "next/server";

import { UpdatePlatformCampaignTemplate } from "../../../../../contexts/platform/application/campaign_templates/UpdatePlatformCampaignTemplate";
import { InvalidPlatformCampaignTemplate } from "../../../../../contexts/platform/domain/InvalidPlatformCampaignTemplate";
import { PlatformCampaignTemplateNotFound } from "../../../../../contexts/platform/domain/PlatformCampaignTemplateNotFound";
import { container } from "../../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { HttpNextResponse } from "../../../../../contexts/shared/infrastructure/http/HttpNextResponse";
import { requirePlatformSession } from "../../../../../lib/auth/requirePlatformSession";
import { platformCampaignTemplateToJson } from "../../../../../lib/platform/campaignTemplates";
import { getResolvedTenantFromRequest } from "../../../../../lib/tenant/getResolvedTenant";

export const dynamic = "force-dynamic";

type PatchBody = {
	name?: string;
	description?: string;
	requiredStamps?: number;
	suggestedStampTypeLabel?: string;
	visualTemplate?: string;
	cardBackgroundVariant?: string;
	conditions?: string;
	isActive?: boolean;
	sortOrder?: number;
};

export async function PATCH(
	request: Request,
	context: { params: { templateId: string } },
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

	let body: PatchBody;
	try {
		body = (await request.json()) as PatchBody;
	} catch {
		return NextResponse.json({ error: { description: "Invalid JSON body" } }, { status: 400 });
	}

	try {
		const template = await container.get(UpdatePlatformCampaignTemplate).execute({
			templateId: context.params.templateId,
			input: body,
		});

		return NextResponse.json({ template: platformCampaignTemplateToJson(template) });
	} catch (error) {
		if (error instanceof InvalidPlatformCampaignTemplate) {
			return HttpNextResponse.domainError(error, 400);
		}

		if (error instanceof PlatformCampaignTemplateNotFound) {
			return HttpNextResponse.domainError(error, 404);
		}

		throw error;
	}
}
