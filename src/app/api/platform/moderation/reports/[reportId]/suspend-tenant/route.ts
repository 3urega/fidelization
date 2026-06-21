import "reflect-metadata";

import { NextResponse } from "next/server";

import { SuspendTenantForModerationReport } from "../../../../../../contexts/platform/application/moderation/SuspendTenantForModerationReport";
import { InvalidModerationReport } from "../../../../../../contexts/platform/domain/InvalidModerationReport";
import { ModerationReportAlreadyResolved } from "../../../../../../contexts/platform/domain/ModerationReportAlreadyResolved";
import { ModerationReportNotFound } from "../../../../../../contexts/platform/domain/ModerationReportNotFound";
import { container } from "../../../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { HttpNextResponse } from "../../../../../../contexts/shared/infrastructure/http/HttpNextResponse";
import { platformTenantToJson } from "../../../../../../lib/auth/http";
import { requirePlatformSession } from "../../../../../../lib/auth/requirePlatformSession";
import { moderationReportEntityToJson } from "../../../../../../lib/platform/moderation";
import { getResolvedTenantFromRequest } from "../../../../../../lib/tenant/getResolvedTenant";
import { TenantNotFound } from "../../../../../../contexts/tenants/tenants/domain/TenantNotFound";

export const dynamic = "force-dynamic";

export async function POST(
	request: Request,
	context: { params: { reportId: string } },
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
		const result = await container.get(SuspendTenantForModerationReport).execute({
			reportId: context.params.reportId,
			resolvedByUserId: auth.session.userId,
		});

		return NextResponse.json({
			report: moderationReportEntityToJson(result.report),
			tenant: platformTenantToJson(result.tenant),
		});
	} catch (error) {
		if (error instanceof ModerationReportNotFound || error instanceof TenantNotFound) {
			return HttpNextResponse.domainError(error, 404);
		}

		if (error instanceof ModerationReportAlreadyResolved) {
			return HttpNextResponse.domainError(error, 409);
		}

		if (error instanceof InvalidModerationReport) {
			return HttpNextResponse.domainError(error, 400);
		}

		throw error;
	}
}
