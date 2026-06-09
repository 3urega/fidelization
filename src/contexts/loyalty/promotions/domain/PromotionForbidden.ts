import { DomainError } from "../../../shared/domain/DomainError";

export class PromotionForbidden extends DomainError {
	readonly type = "PromotionForbidden";
	readonly message: string;
	readonly role: string;

	constructor(role: string) {
		const message = "Only the business owner can manage promotions";
		super(message);
		this.message = message;
		this.role = role;
	}
}
