import { Service } from "diod";

import { User } from "../../../../identity/users/domain/User";
import { UserAuthenticator } from "../../../../identity/users/application/authenticate/UserAuthenticator";
import { StaffMembershipNotFound } from "../../domain/StaffMembershipNotFound";
import { StaffMembership, TenantMembershipRepository } from "../../domain/TenantMembershipRepository";

export type TenantStaffLoginResult = {
	user: User;
	membership: StaffMembership;
};

@Service()
export class TenantStaffLogin {
	constructor(
		private readonly userAuthenticator: UserAuthenticator,
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

	private async resolveMembership(user: User, tenantId: string | null): Promise<TenantStaffLoginResult> {
		const membership = tenantId
			? await this.membershipRepository.findStaffMembership(user.id.value, tenantId)
			: await this.membershipRepository.findFirstStaffMembershipByUserId(user.id.value);

		if (!membership) {
			throw new StaffMembershipNotFound(user.id.value, tenantId ?? "apex");
		}

		return { user, membership };
	}
}
