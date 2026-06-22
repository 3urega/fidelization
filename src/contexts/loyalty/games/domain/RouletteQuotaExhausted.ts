import { DomainError } from "../../../shared/domain/DomainError";

export class RouletteQuotaExhausted extends DomainError {
	readonly type = "RouletteQuotaExhausted";
	readonly message: string;
	readonly scope: "period" | "daily";

	constructor(scope: "period" | "daily", limit: number) {
		const description =
			scope === "period"
				? `Roulette spin quota exhausted for participation period (max ${limit})`
				: `Daily roulette spin quota exhausted (max ${limit})`;
		super(description);
		this.message = description;
		this.scope = scope;
	}
}
