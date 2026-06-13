import "reflect-metadata";

import { NextResponse } from "next/server";

import { ListStaffScanTargets } from "../../../../../contexts/loyalty/customers/application/scan/ListStaffScanTargets";
import { DomainError } from "../../../../../contexts/shared/domain/DomainError";
import { container } from "../../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { HttpNextResponse } from "../../../../../contexts/shared/infrastructure/http/HttpNextResponse";
import { TenantNotFound } from "../../../../../contexts/tenants/tenants/domain/TenantNotFound";
import { TenantRole } from "../../../../../contexts/tenants/memberships/domain/TenantRole";
import { handleAuthDomainError, staffScanTargetsToJson } from "../../../../../lib/auth/http";
import { requireTenantSession } from "../../../../../lib/auth/requireTenantSession";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
	const auth = await requireTenantSession(request);
	if (auth instanceof NextResponse) {
		return auth;
	}

	try {
		const targets = await container.get(ListStaffScanTargets).execute({
			tenantId: auth.session.tenantId,
			role: auth.session.role as TenantRole,
		});

		return NextResponse.json(staffScanTargetsToJson(targets));
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
