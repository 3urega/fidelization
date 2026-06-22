import { DomainError } from "../../shared/domain/DomainError";

export class InvalidPlatformBranding extends DomainError {
	readonly type = "InvalidPlatformBranding";
	readonly message: string;

	constructor(message: string) {
		super(message);
		this.message = message;
	}
}
