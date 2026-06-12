import { DomainError } from "../../../shared/domain/DomainError";

export class InvalidDiscoverFilter extends DomainError {
	readonly type = "InvalidDiscoverFilter";
	readonly message: string;

	constructor(description: string) {
		super(description);
		this.message = description;
	}
}
