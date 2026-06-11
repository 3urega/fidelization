import { DomainError } from "../../../shared/domain/DomainError";

export class InvalidStampType extends DomainError {
	readonly type = "InvalidStampType";
	readonly message: string;

	constructor(description: string) {
		super(description);
		this.message = description;
	}
}
