import { Customer } from "./Customer";

export abstract class CustomerRepository {
	abstract save(customer: Customer): Promise<void>;

	abstract searchById(tenantId: string, id: string): Promise<Customer | null>;

	abstract searchByQrValue(tenantId: string, qrValue: string): Promise<Customer | null>;
}
