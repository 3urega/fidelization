import "reflect-metadata";

import { NextResponse } from "next/server";

import { GetPlatformAppUserDetail } from "../../../../../contexts/platform/application/users/GetPlatformAppUserDetail";
import { UserDoesNotExist } from "../../../../../contexts/identity/users/domain/UserDoesNotExist";
import { container } from "../../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { HttpNextResponse } from "../../../../../contexts/shared/infrastructure/http/HttpNextResponse";
import { requirePlatformSession } from "../../../../../lib/auth/requirePlatformSession";
import { platformAppUserDetailToJson } from "../../../../../lib/platform/appUsers";
import { getResolvedTenantFromRequest } from "../../../../../lib/tenant/getResolvedTenant";

export const dynamic = "force-dynamic";

export async function GET(
	request: Request,
	context: { params: { userId: string } },
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
		const detail = await container.get(GetPlatformAppUserDetail).execute(context.params.userId);

		return NextResponse.json(platformAppUserDetailToJson(detail));
	} catch (error) {
		if (error instanceof UserDoesNotExist) {
			return HttpNextResponse.domainError(error, 404);
		}

		throw error;
	}
}
