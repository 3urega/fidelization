import { Service } from "diod";
import Stripe from "stripe";

import { env } from "../../../../lib/env";
import {
	CreateStripeCheckoutSessionParams,
	CreateStripeCheckoutSessionResult,
	StripeCheckoutGateway,
} from "../domain/StripeCheckoutGateway";

@Service()
export class StripeCheckoutGatewayStripe extends StripeCheckoutGateway {
	private readonly stripe: Stripe;

	constructor() {
		super();
		this.stripe = new Stripe(env.stripeSecretKey, {
			apiVersion: "2025-02-24.acacia",
		});
	}

	async createCheckoutSession(
		params: CreateStripeCheckoutSessionParams,
	): Promise<CreateStripeCheckoutSessionResult> {
		const session = await this.stripe.checkout.sessions.create({
			mode: "subscription",
			customer_email: params.ownerEmail,
			line_items: [{ price: params.stripePriceId, quantity: 1 }],
			success_url: params.successUrl,
			cancel_url: params.cancelUrl,
			metadata: {
				tenantId: params.tenantId,
				planId: params.planId,
				planName: params.planName,
			},
			subscription_data: {
				metadata: {
					tenantId: params.tenantId,
					planId: params.planId,
					planName: params.planName,
				},
			},
		});

		if (!session.url || !session.id) {
			throw new Error("Stripe Checkout session did not return a URL");
		}

		return {
			checkoutUrl: session.url,
			sessionId: session.id,
		};
	}
}
