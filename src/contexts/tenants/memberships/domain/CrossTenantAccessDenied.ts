import { DomainError } from "../../../shared/domain/DomainError";

export class CrossTenantAccessDenied extends DomainError {
	readonly type = "CrossTenantAccessDenied";
	readonly message = "Session does not match the current business context";
}
