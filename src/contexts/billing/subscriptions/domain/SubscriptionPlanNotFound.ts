import { DomainError } from "../../../shared/domain/DomainError";

export class SubscriptionPlanNotFound extends DomainError {
	readonly type = "SubscriptionPlanNotFound";
	readonly message: string;
	readonly planId: string;

	constructor(planId: string) {
		const message = `Subscription plan ${planId} not found`;
		super(message);
		this.message = message;
		this.planId = planId;
	}
}
