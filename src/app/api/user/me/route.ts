import "reflect-metadata";

import { NextResponse } from "next/server";

import { userAuthResponseToJson } from "../../../../lib/auth/http";
import { requireUserSession } from "../../../../lib/auth/requireUserSession";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
	const auth = await requireUserSession(request);
	if (auth instanceof NextResponse) {
		return auth;
	}

	return NextResponse.json(userAuthResponseToJson(auth.user, { kind: "user" }));
}
