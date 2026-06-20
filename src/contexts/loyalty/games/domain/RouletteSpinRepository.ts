import { RouletteSpin } from "./RouletteSpin";

export abstract class RouletteSpinRepository {
	abstract save(spin: RouletteSpin): Promise<void>;

	abstract searchById(tenantId: string, id: string): Promise<RouletteSpin | null>;

	abstract countByCustomerSince(
		tenantId: string,
		customerId: string,
		since: Date,
	): Promise<number>;
}
