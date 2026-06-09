import { DomainError } from "../../../shared/domain/DomainError";

export class InvalidStripeWebhookSignature extends DomainError {
	readonly type = "InvalidStripeWebhookSignature";
	readonly message: string;

	constructor() {
		const message = "Invalid Stripe webhook signature";
		super(message);
		this.message = message;
	}
}
