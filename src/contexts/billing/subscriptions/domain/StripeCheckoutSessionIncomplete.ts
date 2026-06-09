import { DomainError } from "../../../shared/domain/DomainError";

export class StripeCheckoutSessionIncomplete extends DomainError {
	readonly type = "StripeCheckoutSessionIncomplete";
	readonly message: string;
	readonly stripeSessionId: string;

	constructor(stripeSessionId: string) {
		const message = "Stripe checkout session is missing required subscription data";
		super(message);
		this.message = message;
		this.stripeSessionId = stripeSessionId;
	}
}
