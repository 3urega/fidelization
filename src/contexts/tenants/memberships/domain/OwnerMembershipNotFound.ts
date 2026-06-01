import { DomainError } from "../../../shared/domain/DomainError";

export class OwnerMembershipNotFound extends DomainError {
	readonly type = "OwnerMembershipNotFound";
	readonly message: string;

	constructor(userId: string) {
		const message = "No business owner membership found for this user";
		super(message);
		this.message = message;
		this.userId = userId;
	}

	readonly userId: string;
}
