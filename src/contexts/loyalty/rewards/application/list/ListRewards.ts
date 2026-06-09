import { Service } from "diod";

import { TenantRole } from "../../../../tenants/memberships/domain/TenantRole";
import { TenantAccessSuspended } from "../../../../tenants/tenants/domain/TenantAccessSuspended";
import { TenantNotFound } from "../../../../tenants/tenants/domain/TenantNotFound";
import { TenantRepository } from "../../../../tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../../../../tenants/tenants/domain/TenantStatus";
import { Reward } from "../../domain/Reward";
import { RewardForbidden } from "../../domain/RewardForbidden";
import { RewardRepository } from "../../domain/RewardRepository";

export type ListRewardsParams = {
	tenantId: string;
	role: TenantRole;
};

@Service()
export class ListRewards {
	constructor(
		private readonly tenantRepository: TenantRepository,
		private readonly rewardRepository: RewardRepository,
	) {}

	async execute(params: ListRewardsParams): Promise<Reward[]> {
		if (params.role !== TenantRole.Owner) {
			throw new RewardForbidden(params.role);
		}

		await this.assertTenantAllowsLoyalty(params.tenantId);

		return this.rewardRepository.listByTenant(params.tenantId);
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
