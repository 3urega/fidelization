import { DomainError } from "../../../shared/domain/DomainError";

export class InvalidCredentials extends DomainError {
	readonly type = "InvalidCredentials";
	readonly message: string;

	constructor() {
		const message = "Invalid email or password";
		super(message);
		this.message = message;
	}
}
