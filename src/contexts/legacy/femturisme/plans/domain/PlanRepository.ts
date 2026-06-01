import { Plan } from "./Plan";
import { PlanId } from "./PlanId";
import { PlanSearchResult } from "./PlanSearchResult";

export abstract class PlanRepository {
	abstract save(plan: Plan): Promise<void>;

	abstract search(id: PlanId): Promise<Plan | null>;

	abstract searchSimilar(query: string, limit?: number): Promise<PlanSearchResult[]>;
}
