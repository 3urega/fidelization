import { DomainError } from "../../../shared/domain/DomainError";

export class TenantBrandingForbidden extends DomainError {
	readonly type = "TenantBrandingForbidden";
	readonly message: string;
	readonly role: string;

	constructor(role: string) {
		const message = "Only the business owner can update tenant branding";
		super(message);
		this.message = message;
		this.role = role;
	}
}
