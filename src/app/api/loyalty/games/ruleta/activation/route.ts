import "reflect-metadata";

import { NextResponse } from "next/server";

import { EnableTenantGame } from "../../../../../../contexts/loyalty/games/application/config/EnableTenantGame";
import { DomainError } from "../../../../../../contexts/shared/domain/DomainError";
import { container } from "../../../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { HttpNextResponse } from "../../../../../../contexts/shared/infrastructure/http/HttpNextResponse";
import { TenantNotFound } from "../../../../../../contexts/tenants/tenants/domain/TenantNotFound";
import { handleAuthDomainError } from "../../../../../../lib/auth/http";
import { requireTenantSession } from "../../../../../../lib/auth/requireTenantSession";
import { rouletteConfigToJson } from "../../../../../../lib/loyalty/rouletteConfigJson";
import { requireOwnerRouletteConfigAccess } from "../../../../../../lib/loyalty/requireOwnerRouletteConfigAccess";

export const dynamic = "force-dynamic";

type PatchBody = {
	isEnabled?: boolean;
};

export async function PATCH(request: Request): Promise<Response> {
	const auth = await requireTenantSession(request);
	if (auth instanceof NextResponse) {
		return auth;
	}

	const forbidden = requireOwnerRouletteConfigAccess(auth.session);
	if (forbidden) {
		return forbidden;
	}

	let body: PatchBody;

	try {
		body = (await request.json()) as PatchBody;
	} catch {
		return NextResponse.json(
			{ error: { type: "InvalidRequest", description: "Invalid JSON body" } },
			{ status: 400 },
		);
	}

	if (typeof body.isEnabled !== "boolean") {
		return NextResponse.json(
			{ error: { type: "InvalidRequest", description: "isEnabled must be a boolean" } },
			{ status: 400 },
		);
	}

	try {
		const result = await container.get(EnableTenantGame).execute({
			tenantId: auth.session.tenantId,
			isEnabled: body.isEnabled,
		});

		return NextResponse.json({
			isEnabled: result.isEnabled,
			config: rouletteConfigToJson(result.config),
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
