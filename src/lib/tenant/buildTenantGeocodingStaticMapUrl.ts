import type { GeocodingProviderId } from "../../contexts/shared/geocoding/domain/GeocodingProvider";
import { env } from "../env";

export class InvalidStaticMapCoordinates extends Error {
	constructor(message: string) {
		super(message);
		this.name = "InvalidStaticMapCoordinates";
	}
}

export type StaticMapInput = {
	latitude: number;
	longitude: number;
	provider: GeocodingProviderId;
	accessToken: string;
	width?: number;
	height?: number;
	zoom?: number;
};

export type StaticMapCredentials = {
	provider: GeocodingProviderId;
	token: string;
};

const DEFAULT_WIDTH = 600;
const DEFAULT_HEIGHT = 240;
const DEFAULT_ZOOM = 14;
const PIN_COLOR = "7C3AED";

function assertValidCoordinates(latitude: number, longitude: number): void {
	if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
		throw new InvalidStaticMapCoordinates("Invalid latitude");
	}

	if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
		throw new InvalidStaticMapCoordinates("Invalid longitude");
	}
}

export function buildTenantGeocodingStaticMapUrl(input: StaticMapInput): string {
	const {
		latitude,
		longitude,
		provider,
		accessToken,
		width = DEFAULT_WIDTH,
		height = DEFAULT_HEIGHT,
		zoom = DEFAULT_ZOOM,
	} = input;

	assertValidCoordinates(latitude, longitude);

	if (!accessToken.trim()) {
		throw new Error("Static map access token is required");
	}

	if (provider === "google") {
		const url = new URL("https://maps.googleapis.com/maps/api/staticmap");
		url.searchParams.set("center", `${latitude},${longitude}`);
		url.searchParams.set("zoom", String(zoom));
		url.searchParams.set("size", `${width}x${height}`);
		url.searchParams.set("scale", "2");
		url.searchParams.set("markers", `color:0x${PIN_COLOR}|${latitude},${longitude}`);
		url.searchParams.set("key", accessToken);

		return url.toString();
	}

	const overlay = `pin-l+${PIN_COLOR}(${longitude},${latitude})`;
	const center = `${longitude},${latitude},${zoom},0`;
	const size = `${width}x${height}@2x`;

	return (
		`https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/` +
		`${overlay}/${center}/${size}?access_token=${encodeURIComponent(accessToken)}`
	);
}

export function resolveStaticMapCredentials(): StaticMapCredentials | null {
	const provider = env.geocodingProvider;

	if (provider === "google") {
		const token = env.googleMapsGeocodingApiKey;
		if (!token) {
			return null;
		}

		return { provider, token };
	}

	const token = env.mapboxAccessToken;
	if (!token) {
		return null;
	}

	return { provider, token };
}
