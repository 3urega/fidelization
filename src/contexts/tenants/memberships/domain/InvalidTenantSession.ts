import { DomainError } from "../../../shared/domain/DomainError";

export class InvalidTenantSession extends DomainError {
	readonly type = "InvalidTenantSession";
	readonly message = "Session is no longer valid for this business";
}
