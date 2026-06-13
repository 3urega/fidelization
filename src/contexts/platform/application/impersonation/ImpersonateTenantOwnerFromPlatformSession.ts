import { Service } from "diod";

import { UserFinder } from "../../../identity/users/application/find/UserFinder";
import { User } from "../../../identity/users/domain/User";
import { StaffMembership } from "../../../tenants/memberships/domain/TenantMembershipRepository";
import { TenantMembershipRepository } from "../../../tenants/memberships/domain/TenantMembershipRepository";
import { TenantRole } from "../../../tenants/memberships/domain/TenantRole";
import { TenantNotFound } from "../../../tenants/tenants/domain/TenantNotFound";
import { TenantRepository } from "../../../tenants/tenants/domain/TenantRepository";
import { PlatformImpersonationEventRepository } from "../../domain/PlatformImpersonationEventRepository";
import { TenantHasNoOwner } from "../../domain/TenantHasNoOwner";

export type ImpersonateTenantOwnerFromPlatformSessionParams = {
	platformUserId: string;
	tenantId: string;
};

export type ImpersonateTenantOwnerFromPlatformSessionResult = {
	user: User;
	membership: StaffMembership;
};

@Service()
export class ImpersonateTenantOwnerFromPlatformSession {
	constructor(
		private readonly tenantRepository: TenantRepository,
		private readonly membershipRepository: TenantMembershipRepository,
		private readonly userFinder: UserFinder,
		private readonly impersonationEventRepository: PlatformImpersonationEventRepository,
	) {}

	async execute(
		params: ImpersonateTenantOwnerFromPlatformSessionParams,
	): Promise<ImpersonateTenantOwnerFromPlatformSessionResult> {
		const tenant = await this.tenantRepository.findById(params.tenantId);
		if (!tenant) {
			throw new TenantNotFound(params.tenantId);
		}

		const ownerMembership = await this.membershipRepository.findFirstOwnerMembershipByTenantId(
			params.tenantId,
		);
		if (!ownerMembership || ownerMembership.role !== TenantRole.Owner) {
			throw new TenantHasNoOwner(params.tenantId);
		}

		const user = await this.userFinder.find(ownerMembership.userId);

		await this.impersonationEventRepository.record({
			platformUserId: params.platformUserId,
			tenantId: params.tenantId,
			impersonatedUserId: ownerMembership.userId,
		});

		return {
			user,
			membership: {
				tenant: ownerMembership.tenant,
				role: ownerMembership.role,
			},
		};
	}
}
