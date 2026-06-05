import { Service } from "diod";

import { TenantRole } from "../../../memberships/domain/TenantRole";
import { Tenant } from "../../domain/Tenant";
import { TenantBrandingForbidden } from "../../domain/TenantBrandingForbidden";
import { TenantNotFound } from "../../domain/TenantNotFound";
import {
	parseTenantBrandingUpdate,
	TenantBrandingUpdateInput,
} from "../../domain/TenantBrandingUpdate";
import { TenantRepository } from "../../domain/TenantRepository";

export type UpdateTenantBrandingParams = {
	tenantId: string;
	role: TenantRole;
	branding: TenantBrandingUpdateInput;
};

@Service()
export class UpdateTenantBranding {
	constructor(private readonly tenantRepository: TenantRepository) {}

	async execute(params: UpdateTenantBrandingParams): Promise<Tenant> {
		if (params.role !== TenantRole.Owner) {
			throw new TenantBrandingForbidden(params.role);
		}

		const branding = parseTenantBrandingUpdate(params.branding);

		const existing = await this.tenantRepository.findById(params.tenantId);
		if (!existing) {
			throw new TenantNotFound(params.tenantId);
		}

		const updated = await this.tenantRepository.updateBranding(params.tenantId, branding);
		if (!updated) {
			throw new TenantNotFound(params.tenantId);
		}

		return updated;
	}
}