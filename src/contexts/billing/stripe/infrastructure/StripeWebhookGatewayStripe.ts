import { Service } from "diod";
import Stripe from "stripe";

import { InvalidStripeWebhookSignature } from "../../subscriptions/domain/InvalidStripeWebhookSignature";
import { StripeCheckoutNotConfigured } from "../../subscriptions/domain/StripeCheckoutNotConfigured";
import { StripeCheckoutSessionIncomplete } from "../../subscriptions/domain/StripeCheckoutSessionIncomplete";
import { env } from "../../../../lib/env";
import {
	StripeWebhookGateway,
	StripeWebhookPayload,
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

	parseWebhookPayload(rawBody: string, signature: string | null): StripeWebhookPayload {
		const event = this.constructVerifiedEvent(rawBody, signature);

		if (event.type === "checkout.session.completed") {
			return this.parseCheckoutSessionCompleted(event);
		}

		if (event.type === "invoice.payment_failed") {
			return this.parseInvoiceLifecycle(event, "past_due");
		}

		if (event.type === "invoice.paid") {
			return this.parseInvoiceLifecycle(event, "active");
		}

		if (event.type === "customer.subscription.updated") {
			return this.parseSubscriptionObjectLifecycle(event);
		}

		if (event.type === "customer.subscription.deleted") {
			const subscription = event.data.object as Stripe.Subscription;

			return {
				kind: "subscription.lifecycle",
				eventId: event.id,
				eventType: event.type,
				stripeSubscriptionId: subscription.id,
				stripeStatus: "canceled",
			};
		}

		return {
			kind: "ignored",
			eventId: event.id,
			eventType: event.type,
		};
	}

	private constructVerifiedEvent(rawBody: string, signature: string | null): Stripe.Event {
		const webhookSecret = env.stripeWebhookSecret;
		if (!webhookSecret) {
			throw new StripeCheckoutNotConfigured("webhook");
		}

		if (!signature) {
			throw new InvalidStripeWebhookSignature();
		}

		try {
			return this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
		} catch {
			throw new InvalidStripeWebhookSignature();
		}
	}

	private parseCheckoutSessionCompleted(event: Stripe.Event): StripeWebhookPayload {
		const session = event.data.object as Stripe.Checkout.Session;
		const stripeSubscriptionId = this.extractSubscriptionId(session.subscription);
		const tenantId = session.metadata?.tenantId?.trim() ?? "";
		const planId = session.metadata?.planId?.trim() ?? "";

		if (!stripeSubscriptionId || !tenantId || !planId) {
			throw new StripeCheckoutSessionIncomplete(session.id);
		}

		return {
			kind: "checkout.session.completed",
			eventId: event.id,
			eventType: event.type,
			stripeSessionId: session.id,
			stripeSubscriptionId,
			tenantId,
			planId,
		};
	}

	private parseInvoiceLifecycle(
		event: Stripe.Event,
		stripeStatus: string,
	): StripeWebhookPayload {
		const invoice = event.data.object as Stripe.Invoice;
		const stripeSubscriptionId = this.extractSubscriptionId(invoice.subscription);

		if (!stripeSubscriptionId) {
			return {
				kind: "ignored",
				eventId: event.id,
				eventType: event.type,
			};
		}

		return {
			kind: "subscription.lifecycle",
			eventId: event.id,
			eventType: event.type,
			stripeSubscriptionId,
			stripeStatus,
		};
	}

	private parseSubscriptionObjectLifecycle(event: Stripe.Event): StripeWebhookPayload {
		const subscription = event.data.object as Stripe.Subscription;

		return {
			kind: "subscription.lifecycle",
			eventId: event.id,
			eventType: event.type,
			stripeSubscriptionId: subscription.id,
			stripeStatus: subscription.status,
		};
	}

	private extractSubscriptionId(
		subscription: string | Stripe.Subscription | null | undefined,
	): string | null {
		if (typeof subscription === "string") {
			return subscription;
		}

		return subscription?.id ?? null;
	}
}
