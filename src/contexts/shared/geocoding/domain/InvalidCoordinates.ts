import { DomainError } from "../../domain/DomainError";

export class InvalidCoordinates extends DomainError {
	readonly type = "InvalidCoordinates";
	readonly message: string;

	constructor(description: string) {
		super(description);
		this.message = description;
	}
}
