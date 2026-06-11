import { DomainError } from "../../../shared/domain/DomainError";

export class InvalidStampType extends DomainError {
	readonly type = "InvalidStampType";

	constructor(message: string) {
		super(message);
	}
}
