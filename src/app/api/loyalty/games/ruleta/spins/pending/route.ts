import "reflect-metadata";

import { NextResponse } from "next/server";

import { ListPendingRouletteSpinsForStaff } from "../../../../../../../contexts/loyalty/games/application/redeem/ListPendingRouletteSpinsForStaff";
import { DomainError } from "../../../../../../../contexts/shared/domain/DomainError";
import { container } from "../../../../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { HttpNextResponse } from "../../../../../../../contexts/shared/infrastructure/http/HttpNextResponse";
import { TenantNotFound } from "../../../../../../../contexts/tenants/tenants/domain/TenantNotFound";
import { TenantRole } from "../../../../../../../contexts/tenants/memberships/domain/TenantRole";
import { handleAuthDomainError } from "../../../../../../../lib/auth/http";
import { requireTenantSession } from "../../../../../../../lib/auth/requireTenantSession";
import { pendingRouletteSpinsForStaffToJson } from "../../../../../../../lib/loyalty/rouletteSpinJson";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
	const auth = await requireTenantSession(request);
	if (auth instanceof NextResponse) {
		return auth;
	}

	const qrValue = new URL(request.url).searchParams.get("qrValue")?.trim() ?? "";
	if (!qrValue) {
		return NextResponse.json({ error: { description: "qrValue is required" } }, { status: 400 });
	}

	try {
		const result = await container.get(ListPendingRouletteSpinsForStaff).execute({
			tenantId: auth.session.tenantId,
			qrValue,
			staffRole: auth.session.role as TenantRole,
		});

		return NextResponse.json(pendingRouletteSpinsForStaffToJson(result));
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
