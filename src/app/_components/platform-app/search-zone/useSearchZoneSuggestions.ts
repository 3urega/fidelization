"use client";

import { useEffect, useState } from "react";

import { platformFetch } from "../../../../lib/platform/apiUrl";
import { useDebouncedValue } from "../../../../lib/react/useDebouncedValue";

export type SearchZonePlaceSuggestion = {
	label: string;
	latitude: number;
	longitude: number;
};

export type SearchZoneSuggestionsState =
	| { status: "idle" }
	| { status: "loading" }
	| { status: "ready"; suggestions: SearchZonePlaceSuggestion[]; query: string }
	| { status: "error"; message: string };

const MIN_QUERY_LENGTH = 2;
const DEFAULT_DEBOUNCE_MS = 400;

export function useSearchZoneSuggestions(
	query: string,
	debounceMs = DEFAULT_DEBOUNCE_MS,
): SearchZoneSuggestionsState {
	const debouncedQuery = useDebouncedValue(query.trim(), debounceMs);
	const [state, setState] = useState<SearchZoneSuggestionsState>({ status: "idle" });

	useEffect(() => {
		if (debouncedQuery.length < MIN_QUERY_LENGTH) {
			setState({ status: "idle" });

			return;
		}

		let cancelled = false;

		async function loadSuggestions(): Promise<void> {
			setState({ status: "loading" });

			try {
				const params = new URLSearchParams({ q: debouncedQuery, limit: "5" });
				const response = await platformFetch(`/api/user/search-zone/suggest?${params.toString()}`);
				const body = (await response.json()) as {
					suggestions?: SearchZonePlaceSuggestion[];
					error?: { description?: string };
				};

				if (cancelled) {
					return;
				}

				if (!response.ok || !Array.isArray(body.suggestions)) {
					setState({
						status: "error",
						message: body.error?.description ?? "No se pudieron cargar sugerencias.",
					});

					return;
				}

				setState({
					status: "ready",
					suggestions: body.suggestions,
					query: debouncedQuery,
				});
			} catch {
				if (!cancelled) {
					setState({
						status: "error",
						message: "No se pudieron cargar sugerencias.",
					});
				}
			}
		}

		void loadSuggestions();

		return () => {
			cancelled = true;
		};
	}, [debouncedQuery]);

	return state;
}
