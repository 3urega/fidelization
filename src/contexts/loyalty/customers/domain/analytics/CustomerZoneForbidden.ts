import { DomainError } from "../../../../shared/domain/DomainError";

export class CustomerZoneForbidden extends DomainError {
	readonly type = "CustomerZoneForbidden";
	readonly message: string;
	readonly role: string;

	constructor(role: string) {
		const message = "Only the business owner can access the customer zone";
		super(message);
		this.message = message;
		this.role = role;
	}
}
