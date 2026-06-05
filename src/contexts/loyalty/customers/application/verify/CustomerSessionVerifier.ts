import { Service } from "diod";

import {
	isCustomerSession,
	type CustomerSessionClaims,
	type SessionClaims,
} from "../../../../../lib/auth/sessionClaims";
import { CrossTenantAccessDenied } from "../../../../tenants/memberships/domain/CrossTenantAccessDenied";
import { TenantAccessSuspended } from "../../../../tenants/tenants/domain/TenantAccessSuspended";
import { TenantRepository } from "../../../../tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../../../../tenants/tenants/domain/TenantStatus";
import { Customer } from "../../domain/Customer";
import { InvalidCustomerSession } from "../../domain/InvalidCustomerSession";
import { CustomerRepository } from "../../domain/CustomerRepository";

@Service()
export class CustomerSessionVerifier {
	constructor(
		private readonly tenantRepository: TenantRepository,
		private readonly customerRepository: CustomerRepository,
	) {}

	async verify(
		session: SessionClaims,
		hostTenantId: string | null | undefined,
	): Promise<Customer> {
		if (!isCustomerSession(session)) {
			throw new InvalidCustomerSession();
		}

		return this.verifyCustomerSession(session, hostTenantId);
	}

	private async verifyCustomerSession(
		session: CustomerSessionClaims,
		hostTenantId: string | null | undefined,
	): Promise<Customer> {
		const tenant = await this.tenantRepository.findById(session.tenantId);
		if (!tenant) {
			throw new InvalidCustomerSession();
		}

		if (tenant.status === TenantStatus.Suspended) {
			throw new TenantAccessSuspended(session.tenantId);
		}

		const customer = await this.customerRepository.searchById(
			session.tenantId,
			session.customerId,
		);

		if (!customer) {
			throw new InvalidCustomerSession();
		}

		if (hostTenantId && hostTenantId !== session.tenantId) {
			throw new CrossTenantAccessDenied();
		}

		return customer;
	}
}
