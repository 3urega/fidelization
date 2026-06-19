import { Service } from "diod";

import { env } from "../../../../lib/env";
import { GeocodingFailed } from "../domain/GeocodingFailed";
import { GeocodingNotConfigured } from "../domain/GeocodingNotConfigured";
import type { PlaceSuggestion } from "../domain/PlaceSuggestion";
import { PlaceSuggestionGateway } from "../domain/PlaceSuggestionGateway";

type GoogleAutocompleteResponse = {
	status?: string;
	predictions?: Array<{
		place_id?: string;
	}>;
	error_message?: string;
};

type GooglePlaceDetailsResponse = {
	status?: string;
	result?: {
		formatted_address?: string;
		geometry?: {
			location?: {
				lat?: number;
				lng?: number;
			};
		};
	};
	error_message?: string;
};

@Service()
export class PlaceSuggestionGatewayGoogle extends PlaceSuggestionGateway {
	async suggestPlaces(query: string, limit: number): Promise<PlaceSuggestion[]> {
		const apiKey = env.googleMapsGeocodingApiKey;

		if (!apiKey) {
			throw new GeocodingNotConfigured("google");
		}

		const trimmedQuery = query.trim();

		if (!trimmedQuery) {
			return [];
		}

		const autocompleteUrl = new URL("https://maps.googleapis.com/maps/api/place/autocomplete/json");
		autocompleteUrl.searchParams.set("input", trimmedQuery);
		autocompleteUrl.searchParams.set("components", "country:es");
		autocompleteUrl.searchParams.set("language", "es");
		autocompleteUrl.searchParams.set("key", apiKey);

		let autocompleteResponse: Response;

		try {
			autocompleteResponse = await fetch(autocompleteUrl);
		} catch {
			throw new GeocodingFailed("Google place autocomplete request failed");
		}

		if (!autocompleteResponse.ok) {
			throw new GeocodingFailed(`Google place autocomplete HTTP ${autocompleteResponse.status}`);
		}

		let autocompleteBody: GoogleAutocompleteResponse;

		try {
			autocompleteBody = (await autocompleteResponse.json()) as GoogleAutocompleteResponse;
		} catch {
			throw new GeocodingFailed("Google place autocomplete returned invalid JSON");
		}

		if (autocompleteBody.status !== "OK" && autocompleteBody.status !== "ZERO_RESULTS") {
			const detail = autocompleteBody.error_message?.trim();
			const suffix = detail ? `: ${detail}` : "";

			throw new GeocodingFailed(
				`Google place autocomplete status ${autocompleteBody.status ?? "unknown"}${suffix}`,
			);
		}

		const placeIds = (autocompleteBody.predictions ?? [])
			.map((prediction) => prediction.place_id)
			.filter((placeId): placeId is string => typeof placeId === "string" && placeId.length > 0)
			.slice(0, limit);

		if (placeIds.length === 0) {
			return [];
		}

		const details = await Promise.all(
			placeIds.map((placeId) => this.fetchPlaceDetails(placeId, apiKey)),
		);

		return details.filter((row): row is PlaceSuggestion => row !== null);
	}

	private async fetchPlaceDetails(
		placeId: string,
		apiKey: string,
	): Promise<PlaceSuggestion | null> {
		const detailsUrl = new URL("https://maps.googleapis.com/maps/api/place/details/json");
		detailsUrl.searchParams.set("place_id", placeId);
		detailsUrl.searchParams.set("fields", "geometry,formatted_address");
		detailsUrl.searchParams.set("language", "es");
		detailsUrl.searchParams.set("key", apiKey);

		let detailsResponse: Response;

		try {
			detailsResponse = await fetch(detailsUrl);
		} catch {
			throw new GeocodingFailed("Google place details request failed");
		}

		if (!detailsResponse.ok) {
			throw new GeocodingFailed(`Google place details HTTP ${detailsResponse.status}`);
		}

		let detailsBody: GooglePlaceDetailsResponse;

		try {
			detailsBody = (await detailsResponse.json()) as GooglePlaceDetailsResponse;
		} catch {
			throw new GeocodingFailed("Google place details returned invalid JSON");
		}

		if (detailsBody.status !== "OK") {
			return null;
		}

		const label = detailsBody.result?.formatted_address?.trim();
		const location = detailsBody.result?.geometry?.location;

		if (
			!label ||
			location?.lat === undefined ||
			location.lng === undefined ||
			!Number.isFinite(location.lat) ||
			!Number.isFinite(location.lng)
		) {
			return null;
		}

		return {
			label,
			latitude: location.lat,
			longitude: location.lng,
		};
	}
}
