import { DomainError } from "../../../shared/domain/DomainError";

export class InvalidPromotion extends DomainError {
	readonly type = "InvalidPromotion";
	readonly message: string;

	constructor(description: string) {
		super(description);
		this.message = description;
	}
}
