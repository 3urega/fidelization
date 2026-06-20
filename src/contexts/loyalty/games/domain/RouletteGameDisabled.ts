import { DomainError } from "../../../shared/domain/DomainError";

export class RouletteGameDisabled extends DomainError {
	readonly type = "RouletteGameDisabled";
	readonly message: string;

	constructor() {
		const description = "Roulette is disabled for this establishment";
		super(description);
		this.message = description;
	}
}
