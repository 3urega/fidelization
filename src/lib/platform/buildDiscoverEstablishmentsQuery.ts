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

export type DiscoverProximityMode = "all" | "saved_zone" | "gps_live";

export type UserSearchZoneCoords = {
	label: string;
	latitude: number;
	longitude: number;
};

export type DiscoverActiveNearResult = {
	mode: DiscoverProximityMode;
	near?: DiscoverEstablishmentsNearParams;
	contextLabel?: string;
};

/**
 * Proximity precedence: GPS (when enabled + ready) > saved search zone > alphabetical (no near).
 * When near is set, the API sorts by distance but returns all discoverable establishments.
 */
export function resolveDiscoverActiveNear(input: {
	nearMeEnabled: boolean;
	gps: { latitude: number; longitude: number } | null;
	searchZone: UserSearchZoneCoords | null;
}): DiscoverActiveNearResult {
	if (input.nearMeEnabled && input.gps) {
		return {
			mode: "gps_live",
			near: {
				latitude: input.gps.latitude,
				longitude: input.gps.longitude,
			},
			contextLabel: "tu ubicación actual",
		};
	}

	if (input.searchZone) {
		return {
			mode: "saved_zone",
			near: {
				latitude: input.searchZone.latitude,
				longitude: input.searchZone.longitude,
			},
			contextLabel: input.searchZone.label,
		};
	}

	return { mode: "all" };
}

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
	}

	return searchParams.toString();
}
