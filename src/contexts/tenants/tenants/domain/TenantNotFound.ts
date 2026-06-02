import { DomainError } from "../../../shared/domain/DomainError";

export class TenantNotFound extends DomainError {
	readonly type = "TenantNotFound";
	readonly message = "Negocio no encontrado";
	readonly tenantId: string;

	constructor(tenantId: string) {
		super("Negocio no encontrado");
		this.tenantId = tenantId;
	}
}
