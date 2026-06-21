import { DomainError } from "../../../shared/domain/DomainError";

export class RouletteSpinNotEligible extends DomainError {
	constructor(message = "No active roulette spin eligibility") {
		super(message);
		this.name = "RouletteSpinNotEligible";
	}

	get type(): string {
		return "RouletteSpinNotEligible";
	}
}
