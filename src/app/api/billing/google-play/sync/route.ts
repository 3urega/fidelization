import "reflect-metadata";

import { NextResponse } from "next/server";

import { SyncUserPlanFromGooglePlay } from "../../../../../contexts/billing/google_play_subscription/application/sync/SyncUserPlanFromGooglePlay";
import { UserDoesNotExist } from "../../../../../contexts/identity/users/domain/UserDoesNotExist";
import { container } from "../../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { HttpNextResponse } from "../../../../../contexts/shared/infrastructure/http/HttpNextResponse";
import { getAuthenticatedUserId } from "../../../../../lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<NextResponse> {
	const userId = await getAuthenticatedUserId(request);
	if (!userId) {
		return NextResponse.json({ error: { description: "Unauthorized" } }, { status: 401 });
	}

	try {
		const result = await container.get(SyncUserPlanFromGooglePlay).run(userId);

		return NextResponse.json({ ok: true, plan: result.plan });
	} catch (error) {
		if (error instanceof UserDoesNotExist) {
			return HttpNextResponse.domainError(error, 404);
		}

		return NextResponse.json(
			{
				error: {
					description: error instanceof Error ? error.message : "Sync failed",
				},
			},
			{ status: 500 },
		);
	}
}
