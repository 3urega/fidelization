import "reflect-metadata";

import { NextResponse } from "next/server";

import { EnsureUserQrValue } from "../../../../contexts/identity/users/application/profile/EnsureUserQrValue";
import { container } from "../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { userAuthResponseToJson } from "../../../../lib/auth/http";
import { requireUserSession } from "../../../../lib/auth/requireUserSession";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
	const auth = await requireUserSession(request);
	if (auth instanceof NextResponse) {
		return auth;
	}

	const user = await container.get(EnsureUserQrValue).ensure(auth.session.userId);

	return NextResponse.json(userAuthResponseToJson(user, { kind: "user" }));
}
