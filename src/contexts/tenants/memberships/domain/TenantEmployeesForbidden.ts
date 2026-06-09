import { DomainError } from "../../../shared/domain/DomainError";

export class TenantEmployeesForbidden extends DomainError {
	readonly type = "TenantEmployeesForbidden";
	readonly message: string;
	readonly role: string;

	constructor(role: string) {
		const message = "Only the business owner can manage tenant employees";
		super(message);
		this.message = message;
		this.role = role;
	}
}
