import { Service } from "diod";

import type { PlaceSuggestion } from "../../../shared/geocoding/domain/PlaceSuggestion";
import { PlaceSuggestionGateway } from "../../../shared/geocoding/domain/PlaceSuggestionGateway";

const MIN_QUERY_LENGTH = 2;
const DEFAULT_LIMIT = 5;
const MIN_LIMIT = 1;
const MAX_LIMIT = 8;

export type SuggestSearchZonePlacesParams = {
	query: string;
	limit?: number;
};

export type SuggestSearchZonePlacesResult = {
	suggestions: PlaceSuggestion[];
};

@Service()
export class SuggestSearchZonePlaces {
	constructor(private readonly placeSuggestionGateway: PlaceSuggestionGateway) {}

	async execute(params: SuggestSearchZonePlacesParams): Promise<SuggestSearchZonePlacesResult> {
		const query = params.query.trim();

		if (query.length < MIN_QUERY_LENGTH) {
			return { suggestions: [] };
		}

		const limit = clampLimit(params.limit ?? DEFAULT_LIMIT);
		const suggestions = await this.placeSuggestionGateway.suggestPlaces(query, limit);

		return { suggestions };
	}
}

function clampLimit(limit: number): number {
	if (!Number.isFinite(limit)) {
		return DEFAULT_LIMIT;
	}

	return Math.min(MAX_LIMIT, Math.max(MIN_LIMIT, Math.trunc(limit)));
}
