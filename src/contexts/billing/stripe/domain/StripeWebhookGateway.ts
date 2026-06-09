export type StripeWebhookCheckoutCompleted = {
	kind: "checkout.session.completed";
	eventId: string;
	eventType: string;
	stripeSessionId: string;
	stripeSubscriptionId: string;
	tenantId: string;
	planId: string;
};

export type StripeWebhookSubscriptionLifecycle = {
	kind: "subscription.lifecycle";
	eventId: string;
	eventType: string;
	stripeSubscriptionId: string;
	stripeStatus: string;
};

export type StripeWebhookIgnored = {
	kind: "ignored";
	eventId: string;
	eventType: string;
};

export type StripeWebhookPayload =
	| StripeWebhookCheckoutCompleted
	| StripeWebhookSubscriptionLifecycle
	| StripeWebhookIgnored;

export abstract class StripeWebhookGateway {
	abstract parseWebhookPayload(
		rawBody: string,
		signature: string | null,
	): StripeWebhookPayload;
}
