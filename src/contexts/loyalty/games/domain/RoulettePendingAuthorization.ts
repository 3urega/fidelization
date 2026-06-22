import { DomainError } from "../../../shared/domain/DomainError";

export class RoulettePendingAuthorization extends DomainError {
	readonly type = "RoulettePendingAuthorization";
	readonly message: string;

	constructor(message = "Customer already has a pending roulette spin authorization") {
		super(message);
		this.message = message;
	}
}
