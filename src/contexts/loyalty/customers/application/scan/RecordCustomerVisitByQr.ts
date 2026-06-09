import { Service } from "diod";

import { LoyaltyTransaction } from "../../../loyalty_transactions/domain/LoyaltyTransaction";
import { LoyaltyTransactionRepository } from "../../../loyalty_transactions/domain/LoyaltyTransactionRepository";
import { TenantNotFound } from "../../../../tenants/tenants/domain/TenantNotFound";
import { TenantAccessSuspended } from "../../../../tenants/tenants/domain/TenantAccessSuspended";
import { TenantRepository } from "../../../../tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../../../../tenants/tenants/domain/TenantStatus";
import { Customer } from "../../domain/Customer";
import { CustomerNotFound } from "../../domain/CustomerNotFound";
import { CustomerRepository } from "../../domain/CustomerRepository";

/** MVP: fixed points per staff scan until tenant-configurable rules exist. */
export const DEFAULT_POINTS_PER_VISIT = 1;

export type RecordCustomerVisitByQrInput = {
	tenantId: string;
	qrValue: string;
	createdByUserId: string;
	points?: number;
};

@Service()
export class RecordCustomerVisitByQr {
	constructor(
		private readonly tenantRepository: TenantRepository,
		private readonly customerRepository: CustomerRepository,
		private readonly loyaltyTransactionRepository: LoyaltyTransactionRepository,
	) {}

	async execute(params: RecordCustomerVisitByQrInput): Promise<Customer> {
		await this.assertTenantAllowsLoyalty(params.tenantId);

		const points = params.points ?? DEFAULT_POINTS_PER_VISIT;
		const customer = await this.customerRepository.searchByQrValue(
			params.tenantId,
			params.qrValue.trim(),
		);

		if (!customer) {
			throw new CustomerNotFound(params.tenantId);
		}

		const updated = customer.recordVisit(points);
		const transaction = LoyaltyTransaction.recordPointsEarned({
			tenantId: params.tenantId,
			customerId: updated.id,
			points,
			createdByUserId: params.createdByUserId,
			metadata: { qrValue: params.qrValue.trim(), source: "staff_scan" },
		});

		await this.customerRepository.save(updated);
		await this.loyaltyTransactionRepository.save(transaction);

		return updated;
	}

	private async assertTenantAllowsLoyalty(tenantId: string): Promise<void> {
		const tenant = await this.tenantRepository.findById(tenantId);
		if (!tenant) {
			throw new TenantNotFound(tenantId);
		}

		if (tenant.status === TenantStatus.Suspended) {
			throw new TenantAccessSuspended(tenantId);
		}
	}
}
