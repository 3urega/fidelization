import { DomainError } from "../../../shared/domain/DomainError";

export class InvalidUserSearchZone extends DomainError {
	readonly type = "InvalidUserSearchZone";
	readonly message: string;

	constructor(description: string) {
		super(description);
		this.message = description;
	}
}
