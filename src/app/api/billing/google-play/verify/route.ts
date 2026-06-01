import "reflect-metadata";

import { NextResponse } from "next/server";

import { VerifyGooglePlayPurchase } from "../../../../../contexts/billing/google_play_subscription/application/verify/VerifyGooglePlayPurchase";
import { PurchaseTokenAlreadyLinked } from "../../../../../contexts/billing/google_play_subscription/domain/PurchaseTokenAlreadyLinked";
import { UserDoesNotExist } from "../../../../../contexts/identity/users/domain/UserDoesNotExist";
import { container } from "../../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { HttpNextResponse } from "../../../../../contexts/shared/infrastructure/http/HttpNextResponse";
import { getAuthenticatedUserId } from "../../../../../lib/auth/session";

export const dynamic = "force-dynamic";

type Body = {
	purchaseToken: string;
	productId: string;
};

export async function POST(request: Request): Promise<NextResponse> {
	const userId = await getAuthenticatedUserId(request);
	if (!userId) {
		return NextResponse.json({ error: { description: "Unauthorized" } }, { status: 401 });
	}

	const body = (await request.json()) as Body;
	if (!body.purchaseToken || !body.productId) {
		return NextResponse.json(
			{ error: { description: "purchaseToken and productId are required" } },
			{ status: 400 },
		);
	}

	try {
		const result = await container.get(VerifyGooglePlayPurchase).run({
			userId,
			purchaseToken: body.purchaseToken,
			productId: body.productId,
		});

		return NextResponse.json({ ok: true, plan: result.plan });
	} catch (error) {
		if (error instanceof UserDoesNotExist) {
			return HttpNextResponse.domainError(error, 404);
		}
		if (error instanceof PurchaseTokenAlreadyLinked) {
			return HttpNextResponse.domainError(error, 409);
		}

		return NextResponse.json(
			{
				error: {
					description: error instanceof Error ? error.message : "Verify failed",
				},
			},
			{ status: 500 },
		);
	}
}
