export type GeocodingProviderId = "mapbox" | "google";

const GEOCODING_PROVIDERS: GeocodingProviderId[] = ["mapbox", "google"];

export function parseGeocodingProvider(value: string | undefined): GeocodingProviderId {
	const normalized = value?.trim().toLowerCase();

	if (normalized === "google") {
		return "google";
	}

	return "mapbox";
}

export function isGeocodingProviderId(value: string): value is GeocodingProviderId {
	return GEOCODING_PROVIDERS.includes(value as GeocodingProviderId);
}
