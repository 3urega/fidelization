import { DomainError } from "../../../shared/domain/DomainError";

export class RouletteGameDisabled extends DomainError {
	readonly type = "RouletteGameDisabled";
	readonly message: string;

	constructor(message = "Roulette is disabled for this establishment") {
		super(message);
		this.message = message;
	}
}
