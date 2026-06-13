import { DomainError } from "../../shared/domain/DomainError";

export class TenantHasNoOwner extends DomainError {
	static readonly ERROR_TYPE = "TenantHasNoOwner";
	readonly type = TenantHasNoOwner.ERROR_TYPE;
	readonly message: string;

	constructor(public readonly tenantId: string) {
		const message = "El negocio no tiene propietario registrado";
		super(message);
		this.message = message;
	}
}
