import { Service } from "diod";

import { env } from "../../../../lib/env";
import { Coordinates } from "../domain/Coordinates";
import { GeocodingFailed } from "../domain/GeocodingFailed";
import { GeocodingGateway } from "../domain/GeocodingGateway";
import { GeocodingNotConfigured } from "../domain/GeocodingNotConfigured";

type MapboxGeocodingResponse = {
	features?: Array<{
		center?: [number, number];
	}>;
};

@Service()
export class GeocodingGatewayMapbox extends GeocodingGateway {
	async geocodeAddress(address: string): Promise<Coordinates> {
		const token = env.mapboxAccessToken;

		if (!token) {
			throw new GeocodingNotConfigured("mapbox");
		}

		const query = address.trim();

		if (!query) {
			throw new GeocodingFailed("Address is empty");
		}

		const encodedQuery = encodeURIComponent(query);
		const url =
			`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json` +
			`?limit=1&country=es&access_token=${encodeURIComponent(token)}`;

		let response: Response;

		try {
			response = await fetch(url);
		} catch {
			throw new GeocodingFailed("Mapbox geocoding request failed");
		}

		if (!response.ok) {
			throw new GeocodingFailed(`Mapbox geocoding HTTP ${response.status}`);
		}

		let body: MapboxGeocodingResponse;

		try {
			body = (await response.json()) as MapboxGeocodingResponse;
		} catch {
			throw new GeocodingFailed("Mapbox geocoding returned invalid JSON");
		}

		const center = body.features?.[0]?.center;

		if (!center || center.length < 2) {
			throw new GeocodingFailed("Mapbox geocoding returned no results");
		}

		const [longitude, latitude] = center;

		return Coordinates.fromPrimitives({ latitude, longitude });
	}
}
