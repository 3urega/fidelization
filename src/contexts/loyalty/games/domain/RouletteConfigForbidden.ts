import { DomainError } from "../../../shared/domain/DomainError";
import { TenantRole } from "../../../tenants/memberships/domain/TenantRole";

export class RouletteConfigForbidden extends DomainError {
	readonly type = "RouletteConfigForbidden";
	readonly message: string;

	constructor(role: TenantRole) {
		const description = `Roulette config management is forbidden for role ${role}`;
		super(description);
		this.message = description;
	}
}
