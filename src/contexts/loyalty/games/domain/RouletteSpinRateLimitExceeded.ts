import { DomainError } from "../../../shared/domain/DomainError";

export class RouletteSpinRateLimitExceeded extends DomainError {
	readonly type = "RouletteSpinRateLimitExceeded";
	readonly message: string;

	constructor(period: "day" | "week", limit: number) {
		const description = `Roulette spin limit exceeded: max ${limit} per ${period}`;
		super(description);
		this.message = description;
	}
}
