import { DomainError } from "../../../shared/domain/DomainError";

export class TenantPlanLimitExceeded extends DomainError {
	readonly type = "TenantPlanLimitExceeded";
	readonly message: string;
	readonly tenantId: string;
	readonly limit: number;
	readonly current: number;

	constructor(tenantId: string, limit: number, current: number) {
		const message = `Tenant plan employee limit exceeded (${current}/${limit})`;
		super(message);
		this.message = message;
		this.tenantId = tenantId;
		this.limit = limit;
		this.current = current;
	}
}
