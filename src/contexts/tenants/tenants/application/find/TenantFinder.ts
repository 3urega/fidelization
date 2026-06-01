import { Service } from "diod";

import { Tenant } from "../../domain/Tenant";
import { TenantMembershipRepository } from "../../../memberships/domain/TenantMembershipRepository";

@Service()
export class TenantFinder {
	constructor(private readonly repository: TenantMembershipRepository) {}

	async find(tenantId: string): Promise<Tenant | null> {
		return await this.repository.findById(tenantId);
	}
}
