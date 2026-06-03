import { DomainError } from "../../../shared/domain/DomainError";

export class OwnerBusinessAlreadyExists extends DomainError {
	static readonly ERROR_TYPE = "OwnerBusinessAlreadyExists";
	readonly type = OwnerBusinessAlreadyExists.ERROR_TYPE;
	readonly message: string;

	constructor(public readonly userId: string) {
		const message = `User ${userId} already has a business membership`;
		super(message);
		this.message = message;
	}
}
