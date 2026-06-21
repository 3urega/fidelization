import { DomainError } from "../../../shared/domain/DomainError";

export class RouletteSpinNotPendingRedeem extends DomainError {
	constructor(message = "Roulette spin is not pending physical prize redemption") {
		super(message);
		this.name = "RouletteSpinNotPendingRedeem";
	}

	get type(): string {
		return "RouletteSpinNotPendingRedeem";
	}
}
