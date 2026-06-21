import { DomainError } from "../../shared/domain/DomainError";

export class InvalidModerationReport extends DomainError {
	readonly type = "InvalidModerationReport";
	readonly message: string;

	constructor(message: string) {
		super(message);
		this.message = message;
	}
}
