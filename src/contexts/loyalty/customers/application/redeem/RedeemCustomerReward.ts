import { Service } from "diod";

import { LoyaltyTransaction } from "../../../loyalty_transactions/domain/LoyaltyTransaction";
import { LoyaltyTransactionRepository } from "../../../loyalty_transactions/domain/LoyaltyTransactionRepository";
import { RewardInactive } from "../../../rewards/domain/RewardInactive";
import { RewardNotFound } from "../../../rewards/domain/RewardNotFound";
import { RewardRepository } from "../../../rewards/domain/RewardRepository";
import { TenantAccessSuspended } from "../../../../tenants/tenants/domain/TenantAccessSuspended";
import { TenantNotFound } from "../../../../tenants/tenants/domain/TenantNotFound";
import { TenantRepository } from "../../../../tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../../../../tenants/tenants/domain/TenantStatus";
import { Customer } from "../../domain/Customer";
import { CustomerNotFound } from "../../domain/CustomerNotFound";
import { CustomerRepository } from "../../domain/CustomerRepository";

export type RedeemCustomerRewardParams = {
	tenantId: string;
	customerId: string;
	rewardId: string;
};

export type RedeemCustomerRewardResult = {
	customer: Customer;
	rewardId: string;
};

@Service()
export class RedeemCustomerReward {
	constructor(
		private readonly tenantRepository: TenantRepository,
		private readonly customerRepository: CustomerRepository,
		private readonly rewardRepository: RewardRepository,
		private readonly loyaltyTransactionRepository: LoyaltyTransactionRepository,
	) {}

	async execute(params: RedeemCustomerRewardParams): Promise<RedeemCustomerRewardResult> {
		await this.assertTenantAllowsLoyalty(params.tenantId);

		const reward = await this.rewardRepository.searchById(params.tenantId, params.rewardId);

		if (!reward) {
			throw new RewardNotFound(params.rewardId);
		}

		if (!reward.isActive) {
			throw new RewardInactive(params.rewardId);
		}

		const customer = await this.customerRepository.searchById(params.tenantId, params.customerId);

		if (!customer) {
			throw new CustomerNotFound(params.tenantId);
		}

		const updated = customer.redeemPoints(reward.costPoints);
		const transaction = LoyaltyTransaction.recordRewardRedeemed({
			tenantId: params.tenantId,
			customerId: updated.id,
			points: reward.costPoints,
			metadata: {
				rewardId: reward.id,
				rewardName: reward.name,
				source: "customer_redeem",
			},
		});

		await this.customerRepository.save(updated);
		await this.loyaltyTransactionRepository.save(transaction);

		return { customer: updated, rewardId: reward.id };
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
