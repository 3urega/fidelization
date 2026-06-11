import { DomainError } from "../../../shared/domain/DomainError";

export class InvalidStampScan extends DomainError {
	readonly type = "InvalidStampScan";
	readonly message: string;

	constructor(description: string) {
		super(description);
		this.message = description;
	}
}
