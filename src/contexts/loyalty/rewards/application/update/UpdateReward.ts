import { Service } from "diod";

import { TenantRole } from "../../../../tenants/memberships/domain/TenantRole";
import { TenantAccessSuspended } from "../../../../tenants/tenants/domain/TenantAccessSuspended";
import { TenantNotFound } from "../../../../tenants/tenants/domain/TenantNotFound";
import { TenantRepository } from "../../../../tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../../../../tenants/tenants/domain/TenantStatus";
import { Reward } from "../../domain/Reward";
import { RewardForbidden } from "../../domain/RewardForbidden";
import { RewardNotFound } from "../../domain/RewardNotFound";
import { RewardRepository } from "../../domain/RewardRepository";
import { parseRewardDeactivate } from "../../domain/RewardUpdateInput";

export type UpdateRewardParams = {
	tenantId: string;
	role: TenantRole;
	rewardId: string;
	input: {
		isActive?: boolean;
	};
};

@Service()
export class UpdateReward {
	constructor(
		private readonly tenantRepository: TenantRepository,
		private readonly rewardRepository: RewardRepository,
	) {}

	async execute(params: UpdateRewardParams): Promise<Reward> {
		if (params.role !== TenantRole.Owner) {
			throw new RewardForbidden(params.role);
		}

		await this.assertTenantAllowsLoyalty(params.tenantId);

		parseRewardDeactivate(params.input);

		const existing = await this.rewardRepository.searchById(params.tenantId, params.rewardId);

		if (!existing) {
			throw new RewardNotFound(params.rewardId);
		}

		const updated = existing.deactivate();
		await this.rewardRepository.save(updated);

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
