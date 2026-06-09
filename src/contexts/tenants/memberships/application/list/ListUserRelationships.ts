import { Service } from "diod";

import { CustomerRepository } from "../../../loyalty/customers/domain/CustomerRepository";
import { CustomerEstablishmentSummary } from "../../../loyalty/customers/domain/CustomerEstablishmentSummary";
import { TenantMembershipRepository } from "../../domain/TenantMembershipRepository";

export type UserBusinessSummary = {
	id: string;
	name: string;
	slug: string;
	logoUrl: string | null;
	subscriptionPlan: string;
	subscriptionPlanId: string | null;
	status: string;
	role: string;
};

export type UserEstablishmentSummary = {
	customerId: string;
	tenantId: string;
	name: string;
	slug: string;
	logoUrl: string | null;
	pointsBalance: number;
	visitsCount: number;
};

export type UserRelationshipsResult = {
	businesses: UserBusinessSummary[];
	establishments: UserEstablishmentSummary[];
};

@Service()
export class ListUserRelationships {
	constructor(
		private readonly membershipRepository: TenantMembershipRepository,
		private readonly customerRepository: CustomerRepository,
	) {}

	async list(userId: string): Promise<UserRelationshipsResult> {
		const [memberships, establishments] = await Promise.all([
			this.membershipRepository.listOwnerMembershipsByUserId(userId),
			this.customerRepository.listWithInteractionByUserId(userId),
		]);

		return {
			businesses: memberships.map((membership) => {
				const tenant = membership.tenant.toPrimitives();

				return {
					id: tenant.id,
					name: tenant.name,
					slug: tenant.slug,
					logoUrl: tenant.logoUrl || null,
					subscriptionPlan: tenant.subscriptionPlan,
					subscriptionPlanId: tenant.subscriptionPlanId,
					status: tenant.status,
					role: membership.role,
				};
			}),
			establishments: establishments.map((row) => this.toEstablishmentSummary(row)),
		};
	}

	async findOwnerBusiness(
		userId: string,
		slug: string,
	): Promise<UserBusinessSummary | null> {
		const relationships = await this.list(userId);

		return relationships.businesses.find((business) => business.slug === slug) ?? null;
	}

	private toEstablishmentSummary(row: CustomerEstablishmentSummary): UserEstablishmentSummary {
		return {
			customerId: row.customerId,
			tenantId: row.tenantId,
			name: row.name,
			slug: row.slug,
			logoUrl: row.logoUrl,
			pointsBalance: row.pointsBalance,
			visitsCount: row.visitsCount,
		};
	}
}
