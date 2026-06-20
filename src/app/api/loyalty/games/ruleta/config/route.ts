import "reflect-metadata";

import { NextResponse } from "next/server";

import { GetTenantRouletteConfig } from "../../../../../../contexts/loyalty/games/application/config/GetTenantRouletteConfig";
import { UpsertTenantRouletteConfig } from "../../../../../../contexts/loyalty/games/application/config/UpsertTenantRouletteConfig";
import { DomainError } from "../../../../../../contexts/shared/domain/DomainError";
import { container } from "../../../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { HttpNextResponse } from "../../../../../../contexts/shared/infrastructure/http/HttpNextResponse";
import { TenantNotFound } from "../../../../../../contexts/tenants/tenants/domain/TenantNotFound";
import { handleAuthDomainError } from "../../../../../../lib/auth/http";
import { requireTenantSession } from "../../../../../../lib/auth/requireTenantSession";
import {
	rouletteConfigResultToJson,
	rouletteConfigToJson,
} from "../../../../../../lib/loyalty/rouletteConfigJson";
import { requireOwnerRouletteConfigAccess } from "../../../../../../lib/loyalty/requireOwnerRouletteConfigAccess";

export const dynamic = "force-dynamic";

type PutBody = {
	config?: unknown;
};

export async function GET(request: Request): Promise<Response> {
	const auth = await requireTenantSession(request);
	if (auth instanceof NextResponse) {
		return auth;
	}

	const forbidden = requireOwnerRouletteConfigAccess(auth.session);
	if (forbidden) {
		return forbidden;
	}

	try {
		const result = await container.get(GetTenantRouletteConfig).execute({
			tenantId: auth.session.tenantId,
		});

		return NextResponse.json(rouletteConfigResultToJson(result));
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

export async function PUT(request: Request): Promise<Response> {
	const auth = await requireTenantSession(request);
	if (auth instanceof NextResponse) {
		return auth;
	}

	const forbidden = requireOwnerRouletteConfigAccess(auth.session);
	if (forbidden) {
		return forbidden;
	}

	let body: PutBody;

	try {
		body = (await request.json()) as PutBody;
	} catch {
		return NextResponse.json(
			{ error: { type: "InvalidRouletteConfig", description: "Invalid JSON body" } },
			{ status: 400 },
		);
	}

	try {
		const result = await container.get(UpsertTenantRouletteConfig).execute({
			tenantId: auth.session.tenantId,
			config: body.config,
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
