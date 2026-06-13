import { DomainError } from "../../../shared/domain/DomainError";

export class InvalidDiscoverNearFilter extends DomainError {
	readonly type = "InvalidDiscoverNearFilter";
	readonly message: string;

	constructor(description: string) {
		super(description);
		this.message = description;
	}
}
