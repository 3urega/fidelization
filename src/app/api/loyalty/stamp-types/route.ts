import "reflect-metadata";

import { NextResponse } from "next/server";

import { CreateStampType } from "../../../../contexts/loyalty/stamp_types/application/create/CreateStampType";
import { ListStampTypes } from "../../../../contexts/loyalty/stamp_types/application/list/ListStampTypes";
import { ResolveStampScanOptions } from "../../../../contexts/loyalty/stamp_types/application/scan/ResolveStampScanOptions";
import { DomainError } from "../../../../contexts/shared/domain/DomainError";
import { container } from "../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { HttpNextResponse } from "../../../../contexts/shared/infrastructure/http/HttpNextResponse";
import { TenantNotFound } from "../../../../contexts/tenants/tenants/domain/TenantNotFound";
import { TenantRole } from "../../../../contexts/tenants/memberships/domain/TenantRole";
import { handleAuthDomainError, stampTypeToJson } from "../../../../lib/auth/http";
import { requireTenantSession } from "../../../../lib/auth/requireTenantSession";

export const dynamic = "force-dynamic";

type Body = {
	label?: string;
};

export async function GET(request: Request): Promise<Response> {
	const auth = await requireTenantSession(request);
	if (auth instanceof NextResponse) {
		return auth;
	}

	const role = auth.session.role as TenantRole;

	try {
		const [types, scanOptions] = await Promise.all([
			container.get(ListStampTypes).execute({
				tenantId: auth.session.tenantId,
				role,
			}),
			container.get(ResolveStampScanOptions).execute({
				tenantId: auth.session.tenantId,
				role,
			}),
		]);

		return NextResponse.json({
			types: types.map((stampType) => stampTypeToJson(stampType)),
			hasGenericCampaigns: scanOptions.hasGenericCampaigns,
			selectionRequired: scanOptions.selectionRequired,
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
		const stampType = await container.get(CreateStampType).execute({
			tenantId: auth.session.tenantId,
			role: auth.session.role as TenantRole,
			input: body,
		});

		return NextResponse.json({ stampType: stampTypeToJson(stampType) }, { status: 201 });
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
