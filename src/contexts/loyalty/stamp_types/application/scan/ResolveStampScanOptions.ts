import { Service } from "diod";

import { StampCampaignRepository } from "../../../stamp_campaigns/domain/StampCampaignRepository";
import { TenantRole } from "../../../../tenants/memberships/domain/TenantRole";
import { TenantAccessSuspended } from "../../../../tenants/tenants/domain/TenantAccessSuspended";
import { TenantNotFound } from "../../../../tenants/tenants/domain/TenantNotFound";
import { TenantRepository } from "../../../../tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../../../../tenants/tenants/domain/TenantStatus";
import { StampType } from "../../domain/StampType";
import { StampTypeForbidden } from "../../domain/StampTypeForbidden";
import { StampTypeRepository } from "../../domain/StampTypeRepository";

export type ResolveStampScanOptionsParams = {
	tenantId: string;
	role: TenantRole;
};

export type ResolveStampScanOptionsResult = {
	types: StampType[];
	hasGenericCampaigns: boolean;
	selectionRequired: boolean;
};

@Service()
export class ResolveStampScanOptions {
	constructor(
		private readonly tenantRepository: TenantRepository,
		private readonly stampTypeRepository: StampTypeRepository,
		private readonly stampCampaignRepository: StampCampaignRepository,
	) {}

	async execute(params: ResolveStampScanOptionsParams): Promise<ResolveStampScanOptionsResult> {
		if (params.role !== TenantRole.Owner && params.role !== TenantRole.Employee) {
			throw new StampTypeForbidden(params.role);
		}

		await this.assertTenantAllowsLoyalty(params.tenantId);

		const [types, activeTypeCount, hasGenericCampaigns] = await Promise.all([
			this.stampTypeRepository.listActiveByTenant(params.tenantId),
			this.stampTypeRepository.countActiveByTenant(params.tenantId),
			this.stampCampaignRepository.hasActiveGenericCampaigns(params.tenantId),
		]);

		return {
			types,
			hasGenericCampaigns,
			selectionRequired: activeTypeCount > 0,
		};
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
