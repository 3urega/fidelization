export type CreateStripeCheckoutSessionParams = {
	tenantId: string;
	planId: string;
	planName: string;
	stripePriceId: string;
	ownerEmail: string;
	successUrl: string;
	cancelUrl: string;
};

export type CreateStripeCheckoutSessionResult = {
	checkoutUrl: string;
	sessionId: string;
};

export abstract class StripeCheckoutGateway {
	abstract createCheckoutSession(
		params: CreateStripeCheckoutSessionParams,
	): Promise<CreateStripeCheckoutSessionResult>;
}
