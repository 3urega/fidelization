import { Service } from "diod";

import { GetCustomerStampProgress } from "../../../../loyalty/customers/application/profile/GetCustomerStampProgress";
import type { StampAddedSummary } from "../../../../loyalty/customers/domain/StampProgressSummary";
import { CustomerRepository } from "../../../../loyalty/customers/domain/CustomerRepository";
import { CustomerEstablishmentSummary } from "../../../../loyalty/customers/domain/CustomerEstablishmentSummary";
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

export type UserEstablishmentStampProgress = StampAddedSummary;

export type UserEstablishmentSummary = {
	customerId: string;
	tenantId: string;
	name: string;
	slug: string;
	logoUrl: string | null;
	pointsBalance: number;
	visitsCount: number;
	stampProgress: UserEstablishmentStampProgress[];
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
		private readonly getCustomerStampProgress: GetCustomerStampProgress,
	) {}

	async list(userId: string): Promise<UserRelationshipsResult> {
		const [memberships, allEstablishments] = await Promise.all([
			this.membershipRepository.listOwnerMembershipsByUserId(userId),
			this.customerRepository.listWithInteractionByUserId(userId),
		]);

		const businesses = memberships.map((membership) => {
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
		});

		const ownedSlugs = new Set(businesses.map((business) => business.slug));
		const establishments = allEstablishments.filter((row) => !ownedSlugs.has(row.slug));

		const establishmentSummaries = await Promise.all(
			establishments.map((row) => this.toEstablishmentSummary(row)),
		);

		return {
			businesses,
			establishments: establishmentSummaries,
		};
	}

	async findOwnerBusiness(
		userId: string,
		slug: string,
	): Promise<UserBusinessSummary | null> {
		const relationships = await this.list(userId);

		return relationships.businesses.find((business) => business.slug === slug) ?? null;
	}

	private async toEstablishmentSummary(
		row: CustomerEstablishmentSummary,
	): Promise<UserEstablishmentSummary> {
		const stampProgress = await this.getCustomerStampProgress.execute({
			tenantId: row.tenantId,
			customerId: row.customerId,
		});

		return {
			customerId: row.customerId,
			tenantId: row.tenantId,
			name: row.name,
			slug: row.slug,
			logoUrl: row.logoUrl,
			pointsBalance: row.pointsBalance,
			visitsCount: row.visitsCount,
			stampProgress,
		};
	}
}
