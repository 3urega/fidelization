import { DomainError } from "../../../shared/domain/DomainError";

export class InvalidTenantBranding extends DomainError {
	readonly type = "InvalidTenantBranding";
	readonly message: string;

	constructor(description: string) {
		super(description);
		this.message = description;
	}
}
