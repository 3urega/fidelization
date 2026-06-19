import { GeocodingNotConfigured } from "../../contexts/shared/geocoding/domain/GeocodingNotConfigured";

export function assertPublicMapboxToken(token: string | undefined): string {
	const trimmed = token?.trim();

	if (!trimmed) {
		throw new GeocodingNotConfigured("mapbox");
	}

	if (trimmed.startsWith("sk.")) {
		throw new GeocodingNotConfigured("mapbox");
	}

	if (!trimmed.startsWith("pk.")) {
		throw new GeocodingNotConfigured("mapbox");
	}

	return trimmed;
}

export function resolveMapboxPublicAccessToken(input: {
	mapboxPublicAccessToken?: string;
	mapboxAccessToken?: string;
}): string {
	const explicitPublic = input.mapboxPublicAccessToken?.trim();
	if (explicitPublic) {
		return assertPublicMapboxToken(explicitPublic);
	}

	const serverToken = input.mapboxAccessToken?.trim();
	if (serverToken?.startsWith("pk.")) {
		return assertPublicMapboxToken(serverToken);
	}

	throw new GeocodingNotConfigured("mapbox");
}
