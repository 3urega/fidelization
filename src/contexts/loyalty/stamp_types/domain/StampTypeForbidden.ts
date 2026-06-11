import { DomainError } from "../../../shared/domain/DomainError";
import { TenantRole } from "../../../tenants/memberships/domain/TenantRole";

export class StampTypeForbidden extends DomainError {
	readonly type = "StampTypeForbidden";

	constructor(role: TenantRole) {
		super(`Stamp type management is forbidden for role ${role}`);
	}
}
