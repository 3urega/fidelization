import { DomainError } from "../../../shared/domain/DomainError";

export class InvalidReward extends DomainError {
	readonly type = "InvalidReward";
	readonly message: string;

	constructor(description: string) {
		super(description);
		this.message = description;
	}
}
