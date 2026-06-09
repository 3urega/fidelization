import { Service } from "diod";

import { UserFinder } from "../../../../identity/users/application/find/UserFinder";
import { TenantAccessSuspended } from "../../../../tenants/tenants/domain/TenantAccessSuspended";
import { TenantNotFound } from "../../../../tenants/tenants/domain/TenantNotFound";
import { TenantRepository } from "../../../../tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../../../../tenants/tenants/domain/TenantStatus";
import { Customer } from "../../domain/Customer";
import { CustomerRepository } from "../../domain/CustomerRepository";

export type JoinTenantAsCustomerInput = {
	userId: string;
	slug: string;
};

export type JoinTenantAsCustomerResult = {
	customer: Customer;
	created: boolean;
};

@Service()
export class JoinTenantAsCustomer {
	constructor(
		private readonly tenantRepository: TenantRepository,
		private readonly customerRepository: CustomerRepository,
		private readonly userFinder: UserFinder,
	) {}

	async execute(params: JoinTenantAsCustomerInput): Promise<JoinTenantAsCustomerResult> {
		const slug = params.slug.trim().toLowerCase();
		if (!slug) {
			throw new TenantNotFound(slug);
		}

		const tenant = await this.tenantRepository.findBySlug(slug);
		if (!tenant) {
			throw new TenantNotFound(slug);
		}

		if (tenant.status === TenantStatus.Suspended) {
			throw new TenantAccessSuspended(tenant.id);
		}

		const existing = await this.customerRepository.searchByUserIdAndTenantId(
			params.userId,
			tenant.id,
		);
		if (existing) {
			return { customer: existing, created: false };
		}

		const user = await this.userFinder.find(params.userId);
		const customer = Customer.joinForPlatformUser({
			tenantId: tenant.id,
			userId: params.userId,
			name: user.name.value,
			email: user.email.value,
		});
		await this.customerRepository.save(customer);

		return { customer, created: true };
	}
}
