import { DomainError } from "../../../shared/domain/DomainError";

export class StripeCheckoutNotConfigured extends DomainError {
	readonly type = "StripeCheckoutNotConfigured";
	readonly message: string;
	readonly planName: string;

	constructor(planName: string) {
		const message = `Stripe price is not configured for plan ${planName}`;
		super(message);
		this.message = message;
		this.planName = planName;
	}
}
