import { PlanSearchResult } from "../../plans/domain/PlanSearchResult";
import { PlanSuggestion } from "./PlanSuggestion";

export abstract class PlanSuggestionsGenerator {
	abstract generate(query: string, context: PlanSearchResult[]): Promise<PlanSuggestion[]>;
}
