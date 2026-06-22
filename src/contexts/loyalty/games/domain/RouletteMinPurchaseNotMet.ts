import { DomainError } from "../../../shared/domain/DomainError";

export class RouletteMinPurchaseNotMet extends DomainError {
	readonly type = "RouletteMinPurchaseNotMet";
	readonly message: string;
	readonly purchaseAmountEuros: number;
	readonly minPurchaseEuros: number;

	constructor(purchaseAmountEuros: number, minPurchaseEuros: number) {
		const description = `Purchase amount ${purchaseAmountEuros}€ is below minimum ${minPurchaseEuros}€`;
		super(description);
		this.message = description;
		this.purchaseAmountEuros = purchaseAmountEuros;
		this.minPurchaseEuros = minPurchaseEuros;
	}
}
