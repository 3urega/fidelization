import { Service } from "diod";

import { TenantMembershipRepository } from "../../../memberships/domain/TenantMembershipRepository";
import { Tenant } from "../../domain/Tenant";

@Service()
export class TenantFinder {
	constructor(private readonly repository: TenantMembershipRepository) {}

	async find(tenantId: string): Promise<Tenant | null> {
		return await this.repository.findById(tenantId);
	}
}
