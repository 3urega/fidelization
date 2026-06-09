import { Promotion } from "./Promotion";

export abstract class PromotionRepository {
	abstract save(promotion: Promotion): Promise<void>;

	abstract searchById(tenantId: string, id: string): Promise<Promotion | null>;

	abstract listByTenant(tenantId: string): Promise<Promotion[]>;
}
