import { Service } from "diod";

import { env } from "../../../../lib/env";
import { Coordinates } from "../domain/Coordinates";
import { GeocodingFailed } from "../domain/GeocodingFailed";
import { GeocodingGateway } from "../domain/GeocodingGateway";
import { GeocodingNotConfigured } from "../domain/GeocodingNotConfigured";

type GoogleGeocodingResponse = {
	status?: string;
	results?: Array<{
		geometry?: {
			location?: {
				lat?: number;
				lng?: number;
			};
		};
	}>;
	error_message?: string;
};

@Service()
export class GeocodingGatewayGoogle extends GeocodingGateway {
	async geocodeAddress(address: string): Promise<Coordinates> {
		const apiKey = env.googleMapsGeocodingApiKey;

		if (!apiKey) {
			throw new GeocodingNotConfigured("google");
		}

		const query = address.trim();

		if (!query) {
			throw new GeocodingFailed("Address is empty");
		}

		const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
		url.searchParams.set("address", query);
		url.searchParams.set("key", apiKey);

		let response: Response;

		try {
			response = await fetch(url);
		} catch {
			throw new GeocodingFailed("Google geocoding request failed");
		}

		if (!response.ok) {
			throw new GeocodingFailed(`Google geocoding HTTP ${response.status}`);
		}

		let body: GoogleGeocodingResponse;

		try {
			body = (await response.json()) as GoogleGeocodingResponse;
		} catch {
			throw new GeocodingFailed("Google geocoding returned invalid JSON");
		}

		if (body.status !== "OK") {
			const detail = body.error_message?.trim();
			const suffix = detail ? `: ${detail}` : "";

			throw new GeocodingFailed(`Google geocoding status ${body.status ?? "unknown"}${suffix}`);
		}

		const location = body.results?.[0]?.geometry?.location;

		if (location?.lat === undefined || location.lng === undefined) {
			throw new GeocodingFailed("Google geocoding returned no results");
		}

		return Coordinates.fromPrimitives({
			latitude: location.lat,
			longitude: location.lng,
		});
	}
}
