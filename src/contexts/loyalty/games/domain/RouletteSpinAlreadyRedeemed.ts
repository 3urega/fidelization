import { DomainError } from "../../../shared/domain/DomainError";

export class RouletteSpinAlreadyRedeemed extends DomainError {
	constructor(spinId: string) {
		super(`Roulette spin already redeemed: ${spinId}`);
		this.name = "RouletteSpinAlreadyRedeemed";
	}

	get type(): string {
		return "RouletteSpinAlreadyRedeemed";
	}
}
