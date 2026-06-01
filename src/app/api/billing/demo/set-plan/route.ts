import "reflect-metadata";

import { NextResponse } from "next/server";

import { DemoPlanSetter } from "../../../../../contexts/billing/demo/application/DemoPlanSetter";
import { UserPlan } from "../../../../../contexts/identity/users/domain/UserPlan";
import { container } from "../../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { getAuthenticatedUserId } from "../../../../../lib/auth/session";

type Body = {
	plan: string;
};

export async function POST(request: Request): Promise<NextResponse> {
	const userId = await getAuthenticatedUserId(request);
	if (!userId) {
		return NextResponse.json({ error: { description: "Unauthorized" } }, { status: 401 });
	}

	if (process.env.ALLOW_DEMO_BILLING !== "1") {
		return NextResponse.json(
			{ error: { description: "Demo billing is disabled. Set ALLOW_DEMO_BILLING=1 locally." } },
			{ status: 403 },
		);
	}

	const body = (await request.json()) as Body;
	const plan = body.plan === "PREMIUM" ? UserPlan.Premium : UserPlan.Free;

	try {
		const setter = container.get(DemoPlanSetter);
		const result = await setter.run(userId, plan);

		return NextResponse.json({ ok: true, plan: result.plan });
	} catch (error) {
		return NextResponse.json(
			{ error: { description: error instanceof Error ? error.message : "Error" } },
			{ status: 500 },
		);
	}
}
