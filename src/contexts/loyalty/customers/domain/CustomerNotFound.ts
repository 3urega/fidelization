import { DomainError } from "../../../shared/domain/DomainError";

export class CustomerNotFound extends DomainError {
	readonly type = "CustomerNotFound";
	readonly message: string;
	readonly tenantId: string;

	constructor(tenantId: string, description = "Customer not found") {
		super(description);
		this.message = description;
		this.tenantId = tenantId;
	}
}
