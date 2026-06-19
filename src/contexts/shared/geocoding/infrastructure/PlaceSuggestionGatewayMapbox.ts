import { Service } from "diod";

import { env } from "../../../../lib/env";
import { GeocodingFailed } from "../domain/GeocodingFailed";
import { GeocodingNotConfigured } from "../domain/GeocodingNotConfigured";
import type { PlaceSuggestion } from "../domain/PlaceSuggestion";
import { PlaceSuggestionGateway } from "../domain/PlaceSuggestionGateway";

type MapboxGeocodingResponse = {
	features?: Array<{
		place_name?: string;
		center?: [number, number];
	}>;
};

@Service()
export class PlaceSuggestionGatewayMapbox extends PlaceSuggestionGateway {
	async suggestPlaces(query: string, limit: number): Promise<PlaceSuggestion[]> {
		const token = env.mapboxAccessToken;

		if (!token) {
			throw new GeocodingNotConfigured("mapbox");
		}

		const trimmedQuery = query.trim();

		if (!trimmedQuery) {
			return [];
		}

		const encodedQuery = encodeURIComponent(trimmedQuery);
		const url =
			`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json` +
			`?limit=${limit}&country=es&language=es&access_token=${encodeURIComponent(token)}`;

		let response: Response;

		try {
			response = await fetch(url);
		} catch {
			throw new GeocodingFailed("Mapbox place suggestion request failed");
		}

		if (!response.ok) {
			throw new GeocodingFailed(`Mapbox place suggestion HTTP ${response.status}`);
		}

		let body: MapboxGeocodingResponse;

		try {
			body = (await response.json()) as MapboxGeocodingResponse;
		} catch {
			throw new GeocodingFailed("Mapbox place suggestion returned invalid JSON");
		}

		const suggestions: PlaceSuggestion[] = [];

		for (const feature of body.features ?? []) {
			const label = feature.place_name?.trim();
			const center = feature.center;

			if (!label || !center || center.length < 2) {
				continue;
			}

			const [longitude, latitude] = center;

			if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
				continue;
			}

			suggestions.push({ label, latitude, longitude });
		}

		return suggestions;
	}
}
