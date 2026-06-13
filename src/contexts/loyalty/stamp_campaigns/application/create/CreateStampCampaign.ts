import { Service } from "diod";

import { TenantRole } from "../../../../tenants/memberships/domain/TenantRole";
import { TenantAccessSuspended } from "../../../../tenants/tenants/domain/TenantAccessSuspended";
import { TenantNotFound } from "../../../../tenants/tenants/domain/TenantNotFound";
import { TenantRepository } from "../../../../tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../../../../tenants/tenants/domain/TenantStatus";
import { InvalidStampCampaign } from "../../domain/InvalidStampCampaign";
import { StampCampaign } from "../../domain/StampCampaign";
import { parseStampCampaignCreate } from "../../domain/StampCampaignCreateInput";
import { StampCampaignForbidden } from "../../domain/StampCampaignForbidden";
import { StampCampaignRepository } from "../../domain/StampCampaignRepository";
import { StampTypeNotFound } from "../../../stamp_types/domain/StampTypeNotFound";
import { StampTypeRepository } from "../../../stamp_types/domain/StampTypeRepository";

export type CreateStampCampaignParams = {
	tenantId: string;
	role: TenantRole;
	input: {
		name?: string;
		requiredStamps?: number;
		stampTypeId?: string | null;
		visualTemplate?: unknown;
		cardBackgroundVariant?: unknown;
		conditions?: unknown;
	};
};

@Service()
export class CreateStampCampaign {
	constructor(
		private readonly tenantRepository: TenantRepository,
		private readonly stampCampaignRepository: StampCampaignRepository,
		private readonly stampTypeRepository: StampTypeRepository,
	) {}

	async execute(params: CreateStampCampaignParams): Promise<StampCampaign> {
		if (params.role !== TenantRole.Owner) {
			throw new StampCampaignForbidden(params.role);
		}

		await this.assertTenantAllowsLoyalty(params.tenantId);

		const parsed = parseStampCampaignCreate(params.input);

		const activeTypeCount = await this.stampTypeRepository.countActiveByTenant(params.tenantId);

		if (activeTypeCount === 0) {
			throw new InvalidStampCampaign(
				"Create at least one active stamp type before creating campaigns",
			);
		}

		await this.assertActiveStampType(params.tenantId, parsed.stampTypeId);

		const campaign = StampCampaign.create({
			tenantId: params.tenantId,
			name: parsed.name,
			requiredStamps: parsed.requiredStamps,
			stampTypeId: parsed.stampTypeId,
			visualTemplate: parsed.visualTemplate,
			cardBackgroundVariant: parsed.cardBackgroundVariant,
			conditions: parsed.conditions,
		});

		await this.stampCampaignRepository.saveCampaign(campaign);

		return campaign;
	}

	private async assertActiveStampType(tenantId: string, stampTypeId: string): Promise<void> {
		const stampType = await this.stampTypeRepository.searchById(tenantId, stampTypeId);

		if (!stampType || !stampType.isActive) {
			throw new InvalidStampCampaign("stampTypeId must reference an active stamp type");
		}
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
