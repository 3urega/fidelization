import { Service } from "diod";

import { TenantNotFound } from "../../../../tenants/tenants/domain/TenantNotFound";
import { TenantAccessSuspended } from "../../../../tenants/tenants/domain/TenantAccessSuspended";
import { TenantRepository } from "../../../../tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../../../../tenants/tenants/domain/TenantStatus";
import { Customer, RegisterCustomerParams } from "../../domain/Customer";
import { CustomerRepository } from "../../domain/CustomerRepository";

export type RegisterCustomerInput = RegisterCustomerParams;

@Service()
export class RegisterCustomer {
	constructor(
		private readonly tenantRepository: TenantRepository,
		private readonly customerRepository: CustomerRepository,
	) {}

	async execute(params: RegisterCustomerInput): Promise<Customer> {
		await this.assertTenantAllowsCustomerAccess(params.tenantId);

		const customer = Customer.register(params);
		await this.customerRepository.save(customer);

		return customer;
	}

	private async assertTenantAllowsCustomerAccess(tenantId: string): Promise<void> {
		const tenant = await this.tenantRepository.findById(tenantId);
		if (!tenant) {
			throw new TenantNotFound(tenantId);
		}

		if (tenant.status === TenantStatus.Suspended) {
			throw new TenantAccessSuspended(tenantId);
		}
	}
}
