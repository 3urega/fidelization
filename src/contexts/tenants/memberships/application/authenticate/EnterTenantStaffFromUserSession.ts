import { Service } from "diod";

import { UserFinder } from "../../../../identity/users/application/find/UserFinder";
import { UserRepository } from "../../../../identity/users/domain/UserRepository";
import { PlatformUserCannotUseTenantLogin } from "../../../../platform/domain/PlatformUserCannotUseTenantLogin";
import { TenantAccessSuspended } from "../../../tenants/domain/TenantAccessSuspended";
import { TenantNotFound } from "../../../tenants/domain/TenantNotFound";
import { TenantRepository } from "../../../tenants/domain/TenantRepository";
import { TenantStatus } from "../../../tenants/domain/TenantStatus";
import { StaffMembershipNotFound } from "../../domain/StaffMembershipNotFound";
import { TenantMembershipRepository } from "../../domain/TenantMembershipRepository";
import { type TenantStaffLoginResult } from "./TenantStaffLogin";

export type EnterTenantStaffFromUserSessionParams = {
	userId: string;
	tenantSlug: string;
};

@Service()
export class EnterTenantStaffFromUserSession {
	constructor(
		private readonly userFinder: UserFinder,
		private readonly userRepository: UserRepository,
		private readonly tenantRepository: TenantRepository,
		private readonly membershipRepository: TenantMembershipRepository,
	) {}

	async enter(params: EnterTenantStaffFromUserSessionParams): Promise<TenantStaffLoginResult> {
		const user = await this.userFinder.find(params.userId);

		if (await this.userRepository.isPlatformSuperadmin(user.id.value)) {
			throw new PlatformUserCannotUseTenantLogin();
		}

		const tenant = await this.tenantRepository.findBySlug(params.tenantSlug);
		if (!tenant) {
			throw new TenantNotFound(params.tenantSlug);
		}

		const membership = await this.membershipRepository.findStaffMembership(
			user.id.value,
			tenant.id,
		);
		if (!membership) {
			throw new StaffMembershipNotFound(user.id.value, tenant.id);
		}

		if (membership.tenant.status === TenantStatus.Suspended) {
			throw new TenantAccessSuspended(membership.tenant.id);
		}

		return { user, membership };
	}
}
