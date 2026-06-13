import { Tenant } from "../domain/Tenant";
import { parseTenantStatus } from "../domain/TenantStatus";
import {
	isTenantDiscoveryTagId,
	type TenantDiscoveryTagId,
} from "../domain/TenantDiscoveryTag";
import {
	isGeocodingProviderId,
	type GeocodingProviderId,
} from "../../../shared/geocoding/domain/GeocodingProvider";

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
	latitude?: number | null;
	longitude?: number | null;
	geocodingProvider?: string | null;
	geocodedAt?: Date | null;
	coverImageUrl: string;
	discoveryTags: unknown;
};

export function discoveryTagsFromPrisma(value: unknown): TenantDiscoveryTagId[] {
	if (!Array.isArray(value)) {
		return [];
	}

	return value.filter((entry): entry is TenantDiscoveryTagId => typeof entry === "string" && isTenantDiscoveryTagId(entry));
}

function geocodingProviderFromPrisma(value: string | null): GeocodingProviderId | null {
	if (value === null) {
		return null;
	}

	return isGeocodingProviderId(value) ? value : null;
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
		latitude: row.latitude ?? null,
		longitude: row.longitude ?? null,
		geocodingProvider: geocodingProviderFromPrisma(row.geocodingProvider ?? null),
		geocodedAt: row.geocodedAt?.toISOString() ?? null,
		coverImageUrl: row.coverImageUrl,
		discoveryTags: discoveryTagsFromPrisma(row.discoveryTags),
	});
}
