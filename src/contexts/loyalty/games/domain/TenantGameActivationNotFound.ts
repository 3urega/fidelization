import { DomainError } from "../../../shared/domain/DomainError";

export class TenantGameActivationNotFound extends DomainError {
	readonly type = "TenantGameActivationNotFound";
	readonly message: string;

	constructor(tenantId: string, gameSlug: string) {
		const message = `Game activation not found for tenant ${tenantId} and slug ${gameSlug}`;
		super(message);
		this.message = message;
	}
}
