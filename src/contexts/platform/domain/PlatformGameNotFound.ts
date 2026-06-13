import { DomainError } from "../../shared/domain/DomainError";

export class PlatformGameNotFound extends DomainError {
	readonly type = "PlatformGameNotFound";
	readonly message: string;

	constructor(public readonly id: string) {
		const message = `Platform game ${id} not found`;
		super(message);
		this.message = message;
	}
}
