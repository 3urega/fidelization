import { DomainError } from "../../../shared/domain/DomainError";

export class UserDoesNotExist extends DomainError {
	readonly type = "UserDoesNotExist";
	readonly message: string;

	constructor(public readonly id: string) {
		const message = `The user ${id} does not exist`;
		super(message);
		this.message = message;
	}
}
