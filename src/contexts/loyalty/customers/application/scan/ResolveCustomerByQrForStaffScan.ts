import { Service } from "diod";

import { UserRepository } from "../../../../identity/users/domain/UserRepository";
import { Customer } from "../../domain/Customer";
import { CustomerNotFound } from "../../domain/CustomerNotFound";
import { CustomerRepository } from "../../domain/CustomerRepository";

export type ResolveCustomerByQrForStaffScanParams = {
	tenantId: string;
	qrValue: string;
};

/**
 * 1) Legacy: customers.qr_value in tenant.
 * 2) Platform app: users.qr_value → customers(user_id, tenant_id); auto-join on first scan.
 */
@Service()
export class ResolveCustomerByQrForStaffScan {
	constructor(
		private readonly customerRepository: CustomerRepository,
		private readonly userRepository: UserRepository,
	) {}

	async execute(params: ResolveCustomerByQrForStaffScanParams): Promise<Customer> {
		const byCustomerQr = await this.customerRepository.searchByQrValue(
			params.tenantId,
			params.qrValue,
		);
		if (byCustomerQr) {
			return byCustomerQr;
		}

		const user = await this.userRepository.searchByQrValue(params.qrValue);
		if (!user) {
			throw new CustomerNotFound(params.tenantId);
		}

		const linked = await this.customerRepository.searchByUserIdAndTenantId(
			user.id.value,
			params.tenantId,
		);
		if (linked) {
			return linked;
		}

		const customer = Customer.joinForPlatformUser({
			tenantId: params.tenantId,
			userId: user.id.value,
			name: user.name.value,
			email: user.email.value,
		});
		await this.customerRepository.save(customer);

		return customer;
	}
}
