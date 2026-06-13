import "reflect-metadata";

import { NextResponse } from "next/server";

import { RecordStaffScanByTarget } from "../../../../contexts/loyalty/customers/application/scan/RecordStaffScanByTarget";
import { InvalidStampScan } from "../../../../contexts/loyalty/customers/domain/InvalidStampScan";
import { DomainError } from "../../../../contexts/shared/domain/DomainError";
import { container } from "../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { HttpNextResponse } from "../../../../contexts/shared/infrastructure/http/HttpNextResponse";
import { TenantNotFound } from "../../../../contexts/tenants/tenants/domain/TenantNotFound";
import { TenantRole } from "../../../../contexts/tenants/memberships/domain/TenantRole";
import {
	customerToJson,
	handleAuthDomainError,
	staffScanOutcomesToJson,
} from "../../../../lib/auth/http";
import { requireTenantSession } from "../../../../lib/auth/requireTenantSession";

export const dynamic = "force-dynamic";

type Body = {
	qrValue?: string;
	targetType?: unknown;
	targetId?: unknown;
	stampTypeId?: unknown;
};

export async function POST(request: Request): Promise<Response> {
	const auth = await requireTenantSession(request);
	if (auth instanceof NextResponse) {
		return auth;
	}

	const body = (await request.json()) as Body;
	if (!body.qrValue?.trim()) {
		return NextResponse.json({ error: { description: "qrValue is required" } }, { status: 400 });
	}

	if (body.stampTypeId !== undefined) {
		return HttpNextResponse.domainError(
			new InvalidStampScan("stampTypeId is no longer supported; use targetType and targetId"),
			400,
		);
	}

	try {
		const result = await container.get(RecordStaffScanByTarget).execute({
			tenantId: auth.session.tenantId,
			qrValue: body.qrValue,
			targetType: body.targetType,
			targetId: body.targetId,
			createdByUserId: auth.session.userId,
			staffRole: auth.session.role as TenantRole,
		});

		return NextResponse.json({
			customer: customerToJson(result.customer),
			outcomes: staffScanOutcomesToJson(result.outcomes),
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
