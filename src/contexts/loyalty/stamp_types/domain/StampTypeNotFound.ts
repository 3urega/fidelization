import { DomainError } from "../../../shared/domain/DomainError";

export class StampTypeNotFound extends DomainError {
	readonly type = "StampTypeNotFound";

	constructor(id: string) {
		super(`Stamp type ${id} not found`);
	}
}
