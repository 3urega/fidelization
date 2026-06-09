import { DomainError } from "../../../shared/domain/DomainError";

export class TenantBillingForbidden extends DomainError {
	readonly type = "TenantBillingForbidden";
	readonly message: string;
	readonly role: string;

	constructor(role: string) {
		const message = "Only the business owner can manage tenant billing";
		super(message);
		this.message = message;
		this.role = role;
	}
}
