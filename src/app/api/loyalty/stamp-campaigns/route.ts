import "reflect-metadata";

import { NextResponse } from "next/server";

import { CreateStampCampaign } from "../../../../contexts/loyalty/stamp_campaigns/application/create/CreateStampCampaign";
import { ListStampCampaigns } from "../../../../contexts/loyalty/stamp_campaigns/application/list/ListStampCampaigns";
import { DomainError } from "../../../../contexts/shared/domain/DomainError";
import { container } from "../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { HttpNextResponse } from "../../../../contexts/shared/infrastructure/http/HttpNextResponse";
import { TenantNotFound } from "../../../../contexts/tenants/tenants/domain/TenantNotFound";
import { TenantRole } from "../../../../contexts/tenants/memberships/domain/TenantRole";
import { handleAuthDomainError, stampCampaignToJson } from "../../../../lib/auth/http";
import { requireTenantSession } from "../../../../lib/auth/requireTenantSession";

export const dynamic = "force-dynamic";

type Body = {
	name?: string;
	requiredStamps?: number;
	stampTypeId?: string | null;
	visualTemplate?: string;
	cardBackgroundVariant?: string;
};

export async function GET(request: Request): Promise<Response> {
	const auth = await requireTenantSession(request);
	if (auth instanceof NextResponse) {
		return auth;
	}

	try {
		const campaigns = await container.get(ListStampCampaigns).execute({
			tenantId: auth.session.tenantId,
			role: auth.session.role as TenantRole,
		});

		return NextResponse.json({
			campaigns: campaigns.map((campaign) => stampCampaignToJson(campaign)),
		});
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

export async function POST(request: Request): Promise<Response> {
	const auth = await requireTenantSession(request);
	if (auth instanceof NextResponse) {
		return auth;
	}

	const body = (await request.json()) as Body;

	try {
		const campaign = await container.get(CreateStampCampaign).execute({
			tenantId: auth.session.tenantId,
			role: auth.session.role as TenantRole,
			input: body,
		});

		return NextResponse.json({ campaign: stampCampaignToJson(campaign) }, { status: 201 });
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
