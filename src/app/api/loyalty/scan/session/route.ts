import "reflect-metadata";

import { NextResponse } from "next/server";

import { GetStaffScanSessionContext } from "../../../../../contexts/loyalty/customers/application/scan/GetStaffScanSessionContext";
import { InvalidStampScan } from "../../../../../contexts/loyalty/customers/domain/InvalidStampScan";
import { DomainError } from "../../../../../contexts/shared/domain/DomainError";
import { container } from "../../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { HttpNextResponse } from "../../../../../contexts/shared/infrastructure/http/HttpNextResponse";
import { TenantNotFound } from "../../../../../contexts/tenants/tenants/domain/TenantNotFound";
import { TenantRole } from "../../../../../contexts/tenants/memberships/domain/TenantRole";
import { handleAuthDomainError, staffScanSessionToJson } from "../../../../../lib/auth/http";
import { requireTenantSession } from "../../../../../lib/auth/requireTenantSession";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
	const auth = await requireTenantSession(request);

	if (auth instanceof NextResponse) {
		return auth;
	}

	const url = new URL(request.url);
	const qrValue = url.searchParams.get("qrValue") ?? undefined;
	const customerId = url.searchParams.get("customerId") ?? undefined;

	try {
		const session = await container.get(GetStaffScanSessionContext).execute({
			tenantId: auth.session.tenantId,
			role: auth.session.role as TenantRole,
			qrValue,
			customerId,
		});

		return NextResponse.json(staffScanSessionToJson(session));
	} catch (error) {
		if (error instanceof InvalidStampScan) {
			return HttpNextResponse.domainError(error, 400);
		}

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
