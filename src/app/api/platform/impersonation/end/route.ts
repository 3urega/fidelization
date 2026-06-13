import "reflect-metadata";

import { NextResponse } from "next/server";

import { EndPlatformImpersonation } from "../../../../../contexts/platform/application/impersonation/EndPlatformImpersonation";
import { container } from "../../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { requireImpersonatingTenantSession } from "../../../../../lib/auth/requireImpersonatingTenantSession";
import { jsonWithClearSessionCookie } from "../../../../../lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
	const auth = await requireImpersonatingTenantSession(request);
	if (auth instanceof NextResponse) {
		return auth;
	}

	const result = container.get(EndPlatformImpersonation).execute();

	return jsonWithClearSessionCookie(result);
}
