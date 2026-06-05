import "reflect-metadata";

import { NextResponse } from "next/server";

import { customerToJson } from "../../../../lib/auth/http";
import { requireCustomerSession } from "../../../../lib/auth/requireCustomerSession";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
	const auth = await requireCustomerSession(request);
	if (auth instanceof NextResponse) {
		return auth;
	}

	return NextResponse.json({
		customer: customerToJson(auth.customer),
		kind: auth.session.kind,
		tenantId: auth.session.tenantId,
	});
}
