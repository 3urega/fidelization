import { DomainError } from "../../../shared/domain/DomainError";

export class EmailAlreadyRegistered extends DomainError {
	readonly type = "EmailAlreadyRegistered";
	readonly message: string;

	constructor(public readonly email: string) {
		const message = `Email ${email} is already registered`;
		super(message);
		this.message = message;
	}
}
