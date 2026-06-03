import "reflect-metadata";

import { NextResponse } from "next/server";

import { userToJson } from "../../../../../lib/auth/http";
import { requireOnboardingSession } from "../../../../../lib/auth/requireOnboardingSession";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
	const auth = await requireOnboardingSession(request);
	if (auth instanceof NextResponse) {
		return auth;
	}

	return NextResponse.json({
		user: userToJson(auth.user),
		kind: auth.session.kind,
	});
}
