import type { PlatformOwnersPage } from "../../contexts/platform/domain/PlatformOwnerSummary";

export function platformOwnersPageToJson(page: PlatformOwnersPage): Record<string, unknown> {
	return {
		owners: page.owners.map((owner) => ({
			userId: owner.userId,
			name: owner.name,
			email: owner.email,
			businesses: owner.businesses.map((business) => ({
				tenantId: business.tenantId,
				slug: business.slug,
				name: business.name,
				subscriptionPlan: business.subscriptionPlan,
				status: business.status,
			})),
		})),
		total: page.total,
		hasMore: page.hasMore,
		offset: page.offset,
		limit: page.limit,
	};
}
