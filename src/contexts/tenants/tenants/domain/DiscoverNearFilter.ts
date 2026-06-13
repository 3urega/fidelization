import { InvalidDiscoverNearFilter } from "./InvalidDiscoverNearFilter";

export type DiscoverNearFilter = {
	latitude: number;
	longitude: number;
	radiusKm: number;
};

export const DEFAULT_DISCOVER_NEAR_RADIUS_KM = 25;
export const MAX_DISCOVER_NEAR_RADIUS_KM = 100;

const MIN_LATITUDE = -90;
const MAX_LATITUDE = 90;
const MIN_LONGITUDE = -180;
const MAX_LONGITUDE = 180;

function parseCoordinate(value: string | null | undefined, field: string): number | undefined {
	if (value === null || value === undefined || value.trim() === "") {
		return undefined;
	}

	const parsed = Number.parseFloat(value);

	if (!Number.isFinite(parsed)) {
		throw new InvalidDiscoverNearFilter(`${field} must be a valid number`);
	}

	return parsed;
}

function assertLatitude(latitude: number): void {
	if (latitude < MIN_LATITUDE || latitude > MAX_LATITUDE) {
		throw new InvalidDiscoverNearFilter(
			`latitude must be between ${MIN_LATITUDE} and ${MAX_LATITUDE}`,
		);
	}
}

function assertLongitude(longitude: number): void {
	if (longitude < MIN_LONGITUDE || longitude > MAX_LONGITUDE) {
		throw new InvalidDiscoverNearFilter(
			`longitude must be between ${MIN_LONGITUDE} and ${MAX_LONGITUDE}`,
		);
	}
}

function parseRadiusKm(value: string | null | undefined): number {
	if (value === null || value === undefined || value.trim() === "") {
		return DEFAULT_DISCOVER_NEAR_RADIUS_KM;
	}

	const parsed = Number.parseFloat(value);

	if (!Number.isFinite(parsed) || parsed <= 0 || parsed > MAX_DISCOVER_NEAR_RADIUS_KM) {
		throw new InvalidDiscoverNearFilter(
			`radiusKm must be greater than 0 and at most ${MAX_DISCOVER_NEAR_RADIUS_KM}`,
		);
	}

	return parsed;
}

export function parseDiscoverNearFilter(
	latitudeValue: string | null | undefined,
	longitudeValue: string | null | undefined,
	radiusKmValue?: string | null | undefined,
): DiscoverNearFilter | undefined {
	const latitude = parseCoordinate(latitudeValue, "lat");
	const longitude = parseCoordinate(longitudeValue, "lng");

	if (latitude === undefined && longitude === undefined) {
		return undefined;
	}

	if (latitude === undefined || longitude === undefined) {
		throw new InvalidDiscoverNearFilter("lat and lng must be provided together");
	}

	assertLatitude(latitude);
	assertLongitude(longitude);

	return {
		latitude,
		longitude,
		radiusKm: parseRadiusKm(radiusKmValue),
	};
}
