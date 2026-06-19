import type { PlaceSuggestion } from "./PlaceSuggestion";

export abstract class PlaceSuggestionGateway {
	abstract suggestPlaces(query: string, limit: number): Promise<PlaceSuggestion[]>;
}
