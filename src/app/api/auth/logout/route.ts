import { NextResponse } from "next/server";

import { deleteSessionCookie } from "../../../../lib/auth/session";

export function POST(): NextResponse {
	deleteSessionCookie();

	return NextResponse.json({ ok: true });
}
