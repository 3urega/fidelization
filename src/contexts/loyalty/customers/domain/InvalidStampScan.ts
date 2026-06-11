import { DomainError } from "../../../shared/domain/DomainError";

export class InvalidStampScan extends DomainError {
	readonly type = "InvalidStampScan";

	constructor(message: string) {
		super(message);
	}
}
