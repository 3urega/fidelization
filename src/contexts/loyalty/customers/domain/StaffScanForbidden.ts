import { DomainError } from "../../../shared/domain/DomainError";
import { TenantRole } from "../../../tenants/memberships/domain/TenantRole";

export class StaffScanForbidden extends DomainError {
	readonly type = "StaffScanForbidden";
	readonly message: string;

	constructor(role: TenantRole) {
		const description = `Staff scan is forbidden for role ${role}`;
		super(description);
		this.message = description;
	}
}
