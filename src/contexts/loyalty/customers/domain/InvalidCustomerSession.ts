import { DomainError } from "../../../shared/domain/DomainError";

export class InvalidCustomerSession extends DomainError {
	readonly type = "InvalidCustomerSession";
	readonly message = "Session is no longer valid for this loyalty customer";
}
