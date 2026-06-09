import "reflect-metadata";

import { NextResponse } from "next/server";

import { ProcessStripeWebhook } from "../../../../contexts/billing/subscriptions/application/sync/ProcessStripeWebhook";
import { DomainError } from "../../../../contexts/shared/domain/DomainError";
import { container } from "../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { handleAuthDomainError } from "../../../../lib/auth/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
	const rawBody = await request.text();
	const signature = request.headers.get("stripe-signature");

	try {
		await container.get(ProcessStripeWebhook).execute(rawBody, signature);

		return NextResponse.json({ received: true });
	} catch (error) {
		if (error instanceof DomainError) {
			const response = handleAuthDomainError(error);
			if (response) {
				return response;
			}
		}

		throw error;
	}
}
