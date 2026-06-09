import { DomainError } from "../../../shared/domain/DomainError";

/** Platform user QR scanned at a tenant where they have not joined yet. */
export class CustomerNotRegisteredInTenant extends DomainError {
	readonly type = "CustomerNotRegisteredInTenant";
	readonly message: string;
	readonly tenantId: string;

	constructor(tenantId: string) {
		super("Este usuario no está registrado en este local. Debe unirse desde la app.");
		this.message = "Este usuario no está registrado en este local. Debe unirse desde la app.";
		this.tenantId = tenantId;
	}
}
