import { Service } from "diod";

import {
	isTenantSession,
	type SessionClaims,
	type TenantSessionClaims,
} from "../../../../../lib/auth/session";
import { CrossTenantAccessDenied } from "../../domain/CrossTenantAccessDenied";
import { InvalidTenantSession } from "../../domain/InvalidTenantSession";
import {
	StaffMembership,
	TenantMembershipRepository,
} from "../../domain/TenantMembershipRepository";

@Service()
export class TenantSessionVerifier {
	constructor(private readonly membershipRepository: TenantMembershipRepository) {}

	async verify(
		session: SessionClaims,
		hostTenantId: string | null | undefined,
	): Promise<StaffMembership> {
		if (!isTenantSession(session)) {
			throw new InvalidTenantSession();
		}

		return this.verifyTenantSession(session, hostTenantId);
	}

	private async verifyTenantSession(
		session: TenantSessionClaims,
		hostTenantId: string | null | undefined,
	): Promise<StaffMembership> {
		const membership = await this.membershipRepository.findStaffMembership(
			session.userId,
			session.tenantId,
		);

		if (!membership) {
			throw new InvalidTenantSession();
		}

		if (hostTenantId && hostTenantId !== session.tenantId) {
			throw new CrossTenantAccessDenied();
		}

		return membership;
	}
}
