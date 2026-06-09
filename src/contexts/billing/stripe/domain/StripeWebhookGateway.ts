export type StripeCheckoutSessionCompleted = {
	stripeSessionId: string;
	stripeSubscriptionId: string;
	tenantId: string;
	planId: string;
};

export abstract class StripeWebhookGateway {
	abstract parseCheckoutSessionCompleted(
		rawBody: string,
		signature: string | null,
	): StripeCheckoutSessionCompleted | null;
}
