import { Service } from "diod";

import { UserAuthenticator } from "../../../../identity/users/application/authenticate/UserAuthenticator";
import { User } from "../../../../identity/users/domain/User";
import { UserRepository } from "../../../../identity/users/domain/UserRepository";
import { PlatformUserCannotUseTenantLogin } from "../../../../platform/domain/PlatformUserCannotUseTenantLogin";
import { TenantAccessSuspended } from "../../../tenants/domain/TenantAccessSuspended";
import { TenantStatus } from "../../../tenants/domain/TenantStatus";
import { StaffMembershipNotFound } from "../../domain/StaffMembershipNotFound";
import {
	StaffMembership,
	TenantMembershipRepository,
} from "../../domain/TenantMembershipRepository";

export type TenantStaffLoginResult = {
	user: User;
	membership: StaffMembership;
};

@Service()
export class TenantStaffLogin {
	constructor(
		private readonly userAuthenticator: UserAuthenticator,
		private readonly userRepository: UserRepository,
		private readonly membershipRepository: TenantMembershipRepository,
	) {}

	async loginWithPassword(
		email: string,
		password: string,
		tenantId: string | null,
	): Promise<TenantStaffLoginResult> {
		const user = await this.userAuthenticator.login(email, password);

		return this.resolveMembership(user, tenantId);
	}

	async loginDemo(tenantId: string | null): Promise<TenantStaffLoginResult> {
		const user = await this.userAuthenticator.loginDemo();

		return this.resolveMembership(user, tenantId);
	}

	private async resolveMembership(
		user: User,
		tenantId: string | null,
	): Promise<TenantStaffLoginResult> {
		if (await this.userRepository.isPlatformSuperadmin(user.id.value)) {
			throw new PlatformUserCannotUseTenantLogin();
		}

		const membership = tenantId
			? await this.membershipRepository.findStaffMembership(user.id.value, tenantId)
			: await this.membershipRepository.findFirstStaffMembershipByUserId(user.id.value);

		if (!membership) {
			throw new StaffMembershipNotFound(user.id.value, tenantId ?? "apex");
		}

		if (membership.tenant.status === TenantStatus.Suspended) {
			throw new TenantAccessSuspended(membership.tenant.id);
		}

		return { user, membership };
	}
}
