import { DomainError } from "../../../shared/domain/DomainError";

export class InvalidTenantCoverImage extends DomainError {
	readonly type = "InvalidTenantCoverImage";
	readonly message: string;

	constructor(description: string) {
		super(description);
		this.message = description;
	}
}
