import { DomainError } from "../../../shared/domain/DomainError";

export class RouletteSegmentsExhausted extends DomainError {
	readonly type = "RouletteSegmentsExhausted";
	readonly message: string;

	constructor(message = "All roulette segments are out of stock") {
		super(message);
		this.message = message;
	}
}
