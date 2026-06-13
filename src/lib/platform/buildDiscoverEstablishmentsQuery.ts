import { DEFAULT_DISCOVER_NEAR_RADIUS_KM } from "../../contexts/tenants/tenants/domain/DiscoverNearFilter";
import type { TenantDiscoveryTagId } from "../../contexts/tenants/tenants/domain/TenantDiscoveryTag";

export type DiscoverEstablishmentsNearParams = {
	latitude: number;
	longitude: number;
	radiusKm?: number;
};

export type BuildDiscoverEstablishmentsQueryParams = {
	offset: number;
	limit: number;
	tags?: TenantDiscoveryTagId[];
	near?: DiscoverEstablishmentsNearParams;
};

export function buildDiscoverEstablishmentsQuery(
	params: BuildDiscoverEstablishmentsQueryParams,
): string {
	const searchParams = new URLSearchParams();

	searchParams.set("offset", String(params.offset));
	searchParams.set("limit", String(params.limit));

	for (const tag of params.tags ?? []) {
		searchParams.append("tags", tag);
	}

	if (params.near) {
		searchParams.set("lat", String(params.near.latitude));
		searchParams.set("lng", String(params.near.longitude));
		searchParams.set(
			"radiusKm",
			String(params.near.radiusKm ?? DEFAULT_DISCOVER_NEAR_RADIUS_KM),
		);
	}

	return searchParams.toString();
}
