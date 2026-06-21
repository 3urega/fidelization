import { DomainError } from "../../../shared/domain/DomainError";

export class RouletteSpinNotFound extends DomainError {
	constructor(spinId: string) {
		super(`Roulette spin not found: ${spinId}`);
		this.name = "RouletteSpinNotFound";
	}

	get type(): string {
		return "RouletteSpinNotFound";
	}
}
