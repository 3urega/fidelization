import { DomainError } from "../../../shared/domain/DomainError";

export class InvalidRouletteConfig extends DomainError {
	readonly type = "InvalidRouletteConfig";
	readonly message: string;

	constructor(message: string) {
		super(message);
		this.message = message;
	}
}
