import { DomainError } from "../../../shared/domain/DomainError";

export class RouletteNotEnrolled extends DomainError {
	readonly type = "RouletteNotEnrolled";
	readonly message: string;

	constructor(message = "Customer has not enrolled in roulette for this establishment") {
		super(message);
		this.message = message;
	}
}
