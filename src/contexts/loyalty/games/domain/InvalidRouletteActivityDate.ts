import { DomainError } from "../../../shared/domain/DomainError";

export class InvalidRouletteActivityDate extends DomainError {
	readonly type = "InvalidRouletteActivityDate";
	readonly message: string;

	constructor(message: string) {
		super(message);
		this.message = message;
	}
}
