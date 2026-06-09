import { Service } from "diod";
import Stripe from "stripe";

import { InvalidStripeWebhookSignature } from "../../subscriptions/domain/InvalidStripeWebhookSignature";
import { StripeCheckoutNotConfigured } from "../../subscriptions/domain/StripeCheckoutNotConfigured";
import { StripeCheckoutSessionIncomplete } from "../../subscriptions/domain/StripeCheckoutSessionIncomplete";
import { env } from "../../../../lib/env";
import {
	StripeCheckoutSessionCompleted,
	StripeWebhookGateway,
} from "../domain/StripeWebhookGateway";

@Service()
export class StripeWebhookGatewayStripe extends StripeWebhookGateway {
	private readonly stripe: Stripe;

	constructor() {
		super();
		this.stripe = new Stripe(env.stripeSecretKey, {
			apiVersion: "2025-02-24.acacia",
		});
	}

	parseCheckoutSessionCompleted(
		rawBody: string,
		signature: string | null,
	): StripeCheckoutSessionCompleted | null {
		const webhookSecret = env.stripeWebhookSecret;
		if (!webhookSecret) {
			throw new StripeCheckoutNotConfigured("webhook");
		}

		if (!signature) {
			throw new InvalidStripeWebhookSignature();
		}

		let event: Stripe.Event;
		try {
			event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
		} catch {
			throw new InvalidStripeWebhookSignature();
		}

		if (event.type !== "checkout.session.completed") {
			return null;
		}

		const session = event.data.object as Stripe.Checkout.Session;
		const stripeSubscriptionId =
			typeof session.subscription === "string"
				? session.subscription
				: session.subscription?.id ?? null;
		const tenantId = session.metadata?.tenantId?.trim() ?? "";
		const planId = session.metadata?.planId?.trim() ?? "";

		if (!stripeSubscriptionId || !tenantId || !planId) {
			throw new StripeCheckoutSessionIncomplete(session.id);
		}

		return {
			stripeSessionId: session.id,
			stripeSubscriptionId,
			tenantId,
			planId,
		};
	}
}
