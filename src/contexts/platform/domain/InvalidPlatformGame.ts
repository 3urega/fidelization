import { DomainError } from "../../shared/domain/DomainError";

export class InvalidPlatformGame extends DomainError {
	readonly type = "InvalidPlatformGame";
	readonly message: string;

	constructor(message: string) {
		super(message);
		this.message = message;
	}
}
