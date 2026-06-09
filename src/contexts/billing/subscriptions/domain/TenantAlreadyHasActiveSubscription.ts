import { DomainError } from "../../../shared/domain/DomainError";

export class TenantAlreadyHasActiveSubscription extends DomainError {
	readonly type = "TenantAlreadyHasActiveSubscription";
	readonly message: string;
	readonly tenantId: string;

	constructor(tenantId: string) {
		const message = "Tenant already has an active subscription";
		super(message);
		this.message = message;
		this.tenantId = tenantId;
	}
}
