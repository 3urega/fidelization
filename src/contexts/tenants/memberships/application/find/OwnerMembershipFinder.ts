import { Service } from "diod";

import { OwnerMembershipNotFound } from "../../domain/OwnerMembershipNotFound";
import {
	OwnerMembership,
	TenantMembershipRepository,
} from "../../domain/TenantMembershipRepository";

@Service()
export class OwnerMembershipFinder {
	constructor(private readonly repository: TenantMembershipRepository) {}

	async find(userId: string): Promise<OwnerMembership> {
		const membership = await this.repository.findFirstStaffMembershipByUserId(userId);

		if (!membership) {
			throw new OwnerMembershipNotFound(userId);
		}

		return membership;
	}
}
