import { Service } from "diod";

import { TenantNotFound } from "../../../../tenants/tenants/domain/TenantNotFound";
import { TenantAccessSuspended } from "../../../../tenants/tenants/domain/TenantAccessSuspended";
import { TenantRepository } from "../../../../tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../../../../tenants/tenants/domain/TenantStatus";
import { Customer } from "../../domain/Customer";
import { CustomerNotFound } from "../../domain/CustomerNotFound";
import { CustomerRepository } from "../../domain/CustomerRepository";

export type AuthenticateCustomerByQrInput = {
	tenantId: string;
	qrValue: string;
};

@Service()
export class AuthenticateCustomerByQr {
	constructor(
		private readonly tenantRepository: TenantRepository,
		private readonly customerRepository: CustomerRepository,
	) {}

	async execute(params: AuthenticateCustomerByQrInput): Promise<Customer> {
		await this.assertTenantAllowsCustomerAccess(params.tenantId);

		const customer = await this.customerRepository.searchByQrValue(
			params.tenantId,
			params.qrValue.trim(),
		);

		if (!customer) {
			throw new CustomerNotFound(params.tenantId);
		}

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
