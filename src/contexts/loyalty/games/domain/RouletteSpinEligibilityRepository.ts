import { RouletteSpinEligibility } from "./RouletteSpinEligibility";

export abstract class RouletteSpinEligibilityRepository {
	abstract save(eligibility: RouletteSpinEligibility): Promise<void>;

	abstract findActiveByCustomer(
		tenantId: string,
		customerId: string,
		at?: Date,
	): Promise<RouletteSpinEligibility | null>;

	abstract findUnconsumedByCustomer(
		tenantId: string,
		customerId: string,
	): Promise<RouletteSpinEligibility | null>;

	abstract countUnconsumedCreatedBetween(
		tenantId: string,
		customerId: string,
		start: Date,
		end: Date,
	): Promise<number>;
}
