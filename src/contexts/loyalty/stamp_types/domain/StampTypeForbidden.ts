import { DomainError } from "../../../shared/domain/DomainError";
import { TenantRole } from "../../../tenants/memberships/domain/TenantRole";

export class StampTypeForbidden extends DomainError {
	readonly type = "StampTypeForbidden";
	readonly message: string;

	constructor(role: TenantRole) {
		const description = `Stamp type management is forbidden for role ${role}`;
		super(description);
		this.message = description;
	}
}
