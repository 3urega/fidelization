import { DomainError } from "../../../shared/domain/DomainError";

export class FreePlanDoesNotRequireCheckout extends DomainError {
	readonly type = "FreePlanDoesNotRequireCheckout";
	readonly message: string;
	readonly planId: string;

	constructor(planId: string) {
		const message = "Free plans are assigned without Stripe Checkout";
		super(message);
		this.message = message;
		this.planId = planId;
	}
}
