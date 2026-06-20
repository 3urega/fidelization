import { DomainError } from "../../../shared/domain/DomainError";

export class RouletteGameNotAvailable extends DomainError {
	readonly type = "RouletteGameNotAvailable";
	readonly message: string;

	constructor(reason: string) {
		super(reason);
		this.message = reason;
	}
}
