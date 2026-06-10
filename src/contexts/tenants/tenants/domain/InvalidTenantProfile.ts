import { DomainError } from "../../../shared/domain/DomainError";

export class InvalidTenantProfile extends DomainError {
	readonly type = "InvalidTenantProfile";
	readonly message: string;

	constructor(description: string) {
		super(description);
		this.message = description;
	}
}
