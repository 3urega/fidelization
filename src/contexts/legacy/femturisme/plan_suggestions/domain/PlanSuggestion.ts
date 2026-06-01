export type PlanSuggestionPrimitives = {
	planId: string;
	planTitle: string;
	reason: string;
};

export class PlanSuggestion {
	constructor(
		public readonly planId: string,
		public readonly planTitle: string,
		public readonly reason: string,
	) {}

	static fromPrimitives(primitives: PlanSuggestionPrimitives): PlanSuggestion {
		return new PlanSuggestion(primitives.planId, primitives.planTitle, primitives.reason);
	}

	toPrimitives(): PlanSuggestionPrimitives {
		return {
			planId: this.planId,
			planTitle: this.planTitle,
			reason: this.reason,
		};
	}
}
