import "reflect-metadata";

import { NextResponse } from "next/server";

import { CreatePlatformCampaignTemplate } from "../../../../contexts/platform/application/campaign_templates/CreatePlatformCampaignTemplate";
import { ListPlatformCampaignTemplates } from "../../../../contexts/platform/application/campaign_templates/ListPlatformCampaignTemplates";
import { InvalidPlatformCampaignTemplate } from "../../../../contexts/platform/domain/InvalidPlatformCampaignTemplate";
import { container } from "../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { HttpNextResponse } from "../../../../contexts/shared/infrastructure/http/HttpNextResponse";
import { requirePlatformSession } from "../../../../lib/auth/requirePlatformSession";
import {
	platformCampaignTemplateToJson,
	platformCampaignTemplatesToJson,
} from "../../../../lib/platform/campaignTemplates";
import { getResolvedTenantFromRequest } from "../../../../lib/tenant/getResolvedTenant";

export const dynamic = "force-dynamic";

type PostBody = {
	name?: string;
	description?: string;
	requiredStamps?: number;
	suggestedStampTypeLabel?: string;
	visualTemplate?: string;
	cardBackgroundVariant?: string;
	conditions?: string;
	sortOrder?: number;
};

export async function GET(request: Request): Promise<Response> {
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

	const templates = await container.get(ListPlatformCampaignTemplates).execute();

	return NextResponse.json(platformCampaignTemplatesToJson(templates));
}

export async function POST(request: Request): Promise<Response> {
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

	let body: PostBody;
	try {
		body = (await request.json()) as PostBody;
	} catch {
		return NextResponse.json({ error: { description: "Invalid JSON body" } }, { status: 400 });
	}

	try {
		const template = await container.get(CreatePlatformCampaignTemplate).execute({ input: body });

		return NextResponse.json(
			{ template: platformCampaignTemplateToJson(template) },
			{ status: 201 },
		);
	} catch (error) {
		if (error instanceof InvalidPlatformCampaignTemplate) {
			return HttpNextResponse.domainError(error, 400);
		}

		throw error;
	}
}
