import { type ReactElement } from "react";

import type { SearchZonePlaceSuggestion } from "./useSearchZoneSuggestions";

type SearchZoneSuggestionsListProps = {
	suggestions: SearchZonePlaceSuggestion[];
	onSelect: (suggestion: SearchZonePlaceSuggestion) => void;
};

export function SearchZoneSuggestionsList({
	suggestions,
	onSelect,
}: SearchZoneSuggestionsListProps): ReactElement {
	return (
		<ul className="flex flex-col overflow-hidden rounded-theme border border-border bg-surface">
			{suggestions.map((suggestion) => (
				<li key={`${suggestion.label}-${suggestion.latitude}-${suggestion.longitude}`}>
					<button
						type="button"
						className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-muted/30"
						onClick={() => onSelect(suggestion)}
					>
						{suggestion.label}
					</button>
				</li>
			))}
		</ul>
	);
}
