import { Plan } from "./Plan";

export type PlanSearchResult = {
	plan: Plan;
	matchedChunkContent: string;
};
