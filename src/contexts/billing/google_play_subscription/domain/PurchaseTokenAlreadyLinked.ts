import { DomainError } from "../../../shared/domain/DomainError";

export class PurchaseTokenAlreadyLinked extends DomainError {
	readonly type = "PurchaseTokenAlreadyLinked";
	readonly message: string;

	constructor() {
		const message = "Purchase token is already linked to another user";
		super(message);
		this.message = message;
	}
}
