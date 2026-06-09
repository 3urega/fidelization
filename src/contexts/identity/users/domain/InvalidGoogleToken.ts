import { DomainError } from "../../../shared/domain/DomainError";

export class InvalidGoogleToken extends DomainError {
	readonly type = "InvalidGoogleToken";
	readonly message: string;

	constructor() {
		const message = "Invalid or expired Google sign-in token";
		super(message);
		this.message = message;
	}
}
