import { DomainError } from "../../../shared/domain/DomainError";

export class InsufficientCustomerPoints extends DomainError {
	readonly type = "InsufficientCustomerPoints";
	readonly message: string;
	readonly required: number;
	readonly available: number;

	constructor(required: number, available: number) {
		const message = `Insufficient points: need ${required}, have ${available}`;
		super(message);
		this.message = message;
		this.required = required;
		this.available = available;
	}
}
