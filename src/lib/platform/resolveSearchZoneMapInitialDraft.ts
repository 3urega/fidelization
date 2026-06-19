import {
	DEFAULT_SEARCH_ZONE_MAP_CENTER,
	type MapLatLng,
} from "../maps/mapCenterUtils";
import type { UserLocationResult } from "./requestUserLocation";

export type UserSearchZoneJson = {
	label: string;
	latitude: number;
	longitude: number;
	updatedAt: string;
};

export type SearchZoneDraft = {
	label: string;
	latitude: number;
	longitude: number;
};

export function createInitialDraftFromSavedZone(
	savedZone: UserSearchZoneJson | null,
): SearchZoneDraft {
	if (savedZone) {
		return {
			label: savedZone.label,
			latitude: savedZone.latitude,
			longitude: savedZone.longitude,
		};
	}

	return {
		label: "",
		latitude: DEFAULT_SEARCH_ZONE_MAP_CENTER.latitude,
		longitude: DEFAULT_SEARCH_ZONE_MAP_CENTER.longitude,
	};
}

export function resolveSearchZoneMapInitialDraft(
	gps: UserLocationResult | null,
	savedZone: UserSearchZoneJson | null,
): SearchZoneDraft {
	if (gps) {
		return {
			label: "Tu ubicación actual",
			latitude: gps.latitude,
			longitude: gps.longitude,
		};
	}

	return createInitialDraftFromSavedZone(savedZone);
}

export function searchZoneDraftToMapLatLng(draft: SearchZoneDraft): MapLatLng {
	return {
		latitude: draft.latitude,
		longitude: draft.longitude,
	};
}
