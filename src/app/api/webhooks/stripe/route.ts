import "reflect-metadata";

import { NextResponse } from "next/server";

import { CompleteStripeCheckoutSession } from "../../../../contexts/billing/subscriptions/application/checkout/CompleteStripeCheckoutSession";
import { StripeWebhookGateway } from "../../../../contexts/billing/stripe/domain/StripeWebhookGateway";
import { DomainError } from "../../../../contexts/shared/domain/DomainError";
import { container } from "../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { handleAuthDomainError } from "../../../../lib/auth/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
	const rawBody = await request.text();
	const signature = request.headers.get("stripe-signature");

	try {
		const payload = container.get(StripeWebhookGateway).parseCheckoutSessionCompleted(
			rawBody,
			signature,
		);

		if (!payload) {
			return NextResponse.json({ received: true });
		}

		await container.get(CompleteStripeCheckoutSession).execute(payload);

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
