import { Service } from "diod";

import { TenantRole } from "../../../../tenants/memberships/domain/TenantRole";
import { TenantAccessSuspended } from "../../../../tenants/tenants/domain/TenantAccessSuspended";
import { TenantNotFound } from "../../../../tenants/tenants/domain/TenantNotFound";
import { TenantRepository } from "../../../../tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../../../../tenants/tenants/domain/TenantStatus";
import { Reward } from "../../domain/Reward";
import { parseRewardCreate } from "../../domain/RewardCreateInput";
import { RewardForbidden } from "../../domain/RewardForbidden";
import { RewardRepository } from "../../domain/RewardRepository";

export type CreateRewardParams = {
	tenantId: string;
	role: TenantRole;
	input: {
		name?: string;
		description?: string;
		costPoints?: number;
		type?: string;
	};
};

@Service()
export class CreateReward {
	constructor(
		private readonly tenantRepository: TenantRepository,
		private readonly rewardRepository: RewardRepository,
	) {}

	async execute(params: CreateRewardParams): Promise<Reward> {
		if (params.role !== TenantRole.Owner) {
			throw new RewardForbidden(params.role);
		}

		await this.assertTenantAllowsLoyalty(params.tenantId);

		const parsed = parseRewardCreate(params.input);
		const reward = Reward.create({
			tenantId: params.tenantId,
			name: parsed.name,
			description: parsed.description,
			costPoints: parsed.costPoints,
			type: parsed.type,
		});

		await this.rewardRepository.save(reward);

		return reward;
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
