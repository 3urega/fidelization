import { Tenant } from "../domain/Tenant";
import { parseTenantStatus } from "../domain/TenantStatus";
import {
	isTenantDiscoveryTagId,
	type TenantDiscoveryTagId,
} from "../domain/TenantDiscoveryTag";

export type PrismaTenantRow = {
	id: string;
	name: string;
	slug: string;
	logoUrl: string;
	primaryColor: string;
	secondaryColor: string;
	subscriptionPlan: string;
	subscriptionPlanId: string | null;
	status: string;
	createdAt: Date;
	address: string;
	description: string;
	coverImageUrl: string;
	discoveryTags: unknown;
};

export function discoveryTagsFromPrisma(value: unknown): TenantDiscoveryTagId[] {
	if (!Array.isArray(value)) {
		return [];
	}

	return value.filter((entry): entry is TenantDiscoveryTagId => typeof entry === "string" && isTenantDiscoveryTagId(entry));
}

export function tenantFromPrismaRow(row: PrismaTenantRow): Tenant {
	return Tenant.fromPrimitives({
		id: row.id,
		name: row.name,
		slug: row.slug,
		logoUrl: row.logoUrl,
		primaryColor: row.primaryColor,
		secondaryColor: row.secondaryColor,
		subscriptionPlan: row.subscriptionPlan,
		subscriptionPlanId: row.subscriptionPlanId,
		status: parseTenantStatus(row.status),
		createdAt: row.createdAt.toISOString(),
		address: row.address,
		description: row.description,
		coverImageUrl: row.coverImageUrl,
		discoveryTags: discoveryTagsFromPrisma(row.discoveryTags),
	});
}
