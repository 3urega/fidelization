import { Service } from "diod";

import { PlanRepository } from "../../../plans/domain/PlanRepository";
import { PlanSuggestion } from "../../domain/PlanSuggestion";
import { PlanSuggestionsGenerator } from "../../domain/PlanSuggestionsGenerator";

@Service()
export class PlanSuggester {
	constructor(
		private readonly planRepository: PlanRepository,
		private readonly generator: PlanSuggestionsGenerator,
	) {}

	async suggest(query: string): Promise<PlanSuggestion[]> {
		const context = await this.planRepository.searchSimilar(query, 5);

		return this.generator.generate(query, context);
	}
}
