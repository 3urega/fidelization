import { DomainError } from "../../../shared/domain/DomainError";

export class TenantAccessSuspended extends DomainError {
	readonly type = "TenantAccessSuspended";
	readonly message = "Este negocio está suspendido. Contacta con soporte de la plataforma.";
	readonly tenantId: string;

	constructor(tenantId: string) {
		super("Este negocio está suspendido. Contacta con soporte de la plataforma.");
		this.tenantId = tenantId;
	}
}
