import { DomainError } from "../../shared/domain/DomainError";

export class InvalidPlatformBroadcast extends DomainError {
	readonly type = "InvalidPlatformBroadcast";
	readonly message: string;

	constructor(message: string) {
		super(message);
		this.message = message;
	}
}
