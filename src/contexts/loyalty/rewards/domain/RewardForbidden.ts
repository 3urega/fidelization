import { DomainError } from "../../../shared/domain/DomainError";

export class RewardForbidden extends DomainError {
	readonly type = "RewardForbidden";
	readonly message: string;
	readonly role: string;

	constructor(role: string) {
		const message = "Only the business owner can manage rewards";
		super(message);
		this.message = message;
		this.role = role;
	}
}
