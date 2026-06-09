import { Service } from "diod";

import { TenantMembershipRepository } from "../../domain/TenantMembershipRepository";

export type UserBusinessSummary = {
	id: string;
	name: string;
	slug: string;
	logoUrl: string | null;
	subscriptionPlanId: string | null;
	status: string;
	role: string;
};

export type UserRelationshipsResult = {
	businesses: UserBusinessSummary[];
	establishments: [];
};

@Service()
export class ListUserRelationships {
	constructor(private readonly membershipRepository: TenantMembershipRepository) {}

	async list(userId: string): Promise<UserRelationshipsResult> {
		const memberships = await this.membershipRepository.listOwnerMembershipsByUserId(userId);

		return {
			businesses: memberships.map((membership) => {
				const tenant = membership.tenant.toPrimitives();

				return {
					id: tenant.id,
					name: tenant.name,
					slug: tenant.slug,
					logoUrl: tenant.logoUrl || null,
					subscriptionPlanId: tenant.subscriptionPlanId,
					status: tenant.status,
					role: membership.role,
				};
			}),
			establishments: [],
		};
	}
}
