import { DomainError } from "../../../shared/domain/DomainError";

export class RouletteParticipationPeriodExpired extends DomainError {
	readonly type = "RouletteParticipationPeriodExpired";
	readonly message: string;

	constructor(message = "Roulette participation period has expired") {
		super(message);
		this.message = message;
	}
}
