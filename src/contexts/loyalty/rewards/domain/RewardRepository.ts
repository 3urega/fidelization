import { Reward } from "./Reward";

export abstract class RewardRepository {
	abstract save(reward: Reward): Promise<void>;

	abstract searchById(tenantId: string, id: string): Promise<Reward | null>;

	abstract listByTenant(tenantId: string): Promise<Reward[]>;
}
