import { DomainError } from "../../../shared/domain/DomainError";

export class StripeSubscriptionNotFound extends DomainError {
	readonly type = "StripeSubscriptionNotFound";
	readonly message: string;
	readonly stripeSubscriptionId: string;

	constructor(stripeSubscriptionId: string) {
		const message = `Stripe subscription ${stripeSubscriptionId} not found`;
		super(message);
		this.message = message;
		this.stripeSubscriptionId = stripeSubscriptionId;
	}
}
