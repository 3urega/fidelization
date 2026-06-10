import { DomainError } from "../../../shared/domain/DomainError";

export class TenantProfileForbidden extends DomainError {
	readonly type = "TenantProfileForbidden";
	readonly message: string;
	readonly role: string;

	constructor(role: string) {
		const message = "Only the business owner can update tenant profile";
		super(message);
		this.message = message;
		this.role = role;
	}
}
