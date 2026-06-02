import { LoyaltyTransaction } from "./LoyaltyTransaction";

export abstract class LoyaltyTransactionRepository {
	abstract save(transaction: LoyaltyTransaction): Promise<void>;

	abstract searchById(tenantId: string, id: string): Promise<LoyaltyTransaction | null>;
}
