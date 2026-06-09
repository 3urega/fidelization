import { Service } from "diod";

import { Reward } from "../../../rewards/domain/Reward";
import { RewardRepository } from "../../../rewards/domain/RewardRepository";
import { TenantAccessSuspended } from "../../../../tenants/tenants/domain/TenantAccessSuspended";
import { TenantNotFound } from "../../../../tenants/tenants/domain/TenantNotFound";
import { TenantRepository } from "../../../../tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../../../../tenants/tenants/domain/TenantStatus";

export type GetCustomerActiveRewardsParams = {
	tenantId: string;
};

@Service()
export class GetCustomerActiveRewards {
	constructor(
		private readonly tenantRepository: TenantRepository,
		private readonly rewardRepository: RewardRepository,
	) {}

	async execute(params: GetCustomerActiveRewardsParams): Promise<Reward[]> {
		await this.assertTenantAllowsLoyalty(params.tenantId);

		return this.rewardRepository.listActiveByTenant(params.tenantId);
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
