/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { SuggestSearchZonePlaces } from "../src/contexts/identity/users/application/profile/SuggestSearchZonePlaces";
import { GeocodingFailed } from "../src/contexts/shared/geocoding/domain/GeocodingFailed";
import { GeocodingNotConfigured } from "../src/contexts/shared/geocoding/domain/GeocodingNotConfigured";
import type { PlaceSuggestion } from "../src/contexts/shared/geocoding/domain/PlaceSuggestion";
import { PlaceSuggestionGateway } from "../src/contexts/shared/geocoding/domain/PlaceSuggestionGateway";

const TERRASSA: PlaceSuggestion = {
	label: "Terrassa, Barcelona, Spain",
	latitude: 41.5639,
	longitude: 2.0084,
};

const BARCELONA: PlaceSuggestion = {
	label: "Barcelona, Spain",
	latitude: 41.3874,
	longitude: 2.1686,
};

class SuccessStubPlaceSuggestionGateway extends PlaceSuggestionGateway {
	async suggestPlaces(_query: string, limit: number): Promise<PlaceSuggestion[]> {
		return [TERRASSA, BARCELONA].slice(0, limit);
	}
}

class NotConfiguredStubPlaceSuggestionGateway extends PlaceSuggestionGateway {
	async suggestPlaces(_query: string, _limit: number): Promise<PlaceSuggestion[]> {
		throw new GeocodingNotConfigured("mapbox");
	}
}

class FailedStubPlaceSuggestionGateway extends PlaceSuggestionGateway {
	async suggestPlaces(_query: string, _limit: number): Promise<PlaceSuggestion[]> {
		throw new GeocodingFailed("No results");
	}
}

async function main(): Promise<void> {
	const useCase = new SuggestSearchZonePlaces(new SuccessStubPlaceSuggestionGateway());

	const result = await useCase.execute({ query: "  Terrassa  ", limit: 2 });

	if (
		result.suggestions.length !== 2 ||
		result.suggestions[0]?.label !== TERRASSA.label ||
		result.suggestions[1]?.label !== BARCELONA.label
	) {
		console.error("❌ expected two ordered suggestions", result);
		process.exit(1);
	}

	console.log("✅ SuggestSearchZonePlaces returns ordered suggestions");

	const shortQuery = await useCase.execute({ query: "a" });
	if (shortQuery.suggestions.length !== 0) {
		console.error("❌ short query should return []", shortQuery);
		process.exit(1);
	}

	console.log("✅ query shorter than 2 chars → []");

	const emptyQuery = await useCase.execute({ query: "   " });
	if (emptyQuery.suggestions.length !== 0) {
		console.error("❌ empty query should return []", emptyQuery);
		process.exit(1);
	}

	console.log("✅ empty query → []");

	const clamped = await useCase.execute({ query: "Terrassa", limit: 99 });
	if (clamped.suggestions.length !== 2) {
		console.error("❌ limit should clamp to gateway cap (2 returned)", clamped);
		process.exit(1);
	}

	console.log("✅ limit param accepted");

	const notConfigured = new SuggestSearchZonePlaces(new NotConfiguredStubPlaceSuggestionGateway());

	try {
		await notConfigured.execute({ query: "Terrassa" });
		console.error("❌ not configured should throw GeocodingNotConfigured");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof GeocodingNotConfigured)) {
			console.error("❌ not configured wrong error", error);
			process.exit(1);
		}
	}

	console.log("✅ gateway not configured → GeocodingNotConfigured");

	const failed = new SuggestSearchZonePlaces(new FailedStubPlaceSuggestionGateway());

	try {
		await failed.execute({ query: "Terrassa" });
		console.error("❌ geocoding failed should throw GeocodingFailed");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof GeocodingFailed)) {
			console.error("❌ geocoding failed wrong error", error);
			process.exit(1);
		}
	}

	console.log("✅ gateway failure → GeocodingFailed");
	console.log("✅ verify:search-zone-place-suggest-use-case passed");
}

void main();
