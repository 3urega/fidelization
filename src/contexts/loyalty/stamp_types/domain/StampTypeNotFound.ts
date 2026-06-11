import { DomainError } from "../../../shared/domain/DomainError";

export class StampTypeNotFound extends DomainError {
	readonly type = "StampTypeNotFound";
	readonly message: string;

	constructor(id: string) {
		const description = `Stamp type ${id} not found`;
		super(description);
		this.message = description;
	}
}
