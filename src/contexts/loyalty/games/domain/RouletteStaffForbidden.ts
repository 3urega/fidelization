import { DomainError } from "../../../shared/domain/DomainError";
import { TenantRole } from "../../../tenants/memberships/domain/TenantRole";

export class RouletteStaffForbidden extends DomainError {
	readonly type = "RouletteStaffForbidden";
	readonly message: string;

	constructor(role: TenantRole) {
		const description = `Roulette staff action is forbidden for role ${role}`;
		super(description);
		this.message = description;
	}
}
