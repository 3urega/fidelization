import { DomainError } from "../../../shared/domain/DomainError";

export class StaffMembershipNotFound extends DomainError {
	readonly type = "StaffMembershipNotFound";
	readonly message: string;
	readonly userId: string;
	readonly tenantId: string;

	constructor(userId: string, tenantId: string) {
		const message =
			tenantId === "apex"
				? "Tu cuenta no tiene acceso al panel. Regístrate como propietario o contacta con el negocio."
				: "No tienes acceso a este negocio. Usa la URL de tu negocio (tu subdominio) o inicia sesión en localhost sin subdominio.";
		super(message);
		this.message = message;
		this.userId = userId;
		this.tenantId = tenantId;
	}
}
