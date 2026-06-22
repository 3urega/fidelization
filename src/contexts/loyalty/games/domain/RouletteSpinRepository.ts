import { RouletteSpin } from "./RouletteSpin";

export abstract class RouletteSpinRepository {
	abstract save(spin: RouletteSpin): Promise<void>;

	abstract searchById(tenantId: string, id: string): Promise<RouletteSpin | null>;

	abstract countByCustomerSince(
		tenantId: string,
		customerId: string,
		since: Date,
	): Promise<number>;

	abstract countByCustomerBetween(
		tenantId: string,
		customerId: string,
		start: Date,
		end: Date,
	): Promise<number>;

	abstract listPendingRedeemByCustomer(
		tenantId: string,
		customerId: string,
	): Promise<RouletteSpin[]>;

	abstract listRecentByCustomer(
		tenantId: string,
		customerId: string,
		limit: number,
	): Promise<RouletteSpin[]>;
}
