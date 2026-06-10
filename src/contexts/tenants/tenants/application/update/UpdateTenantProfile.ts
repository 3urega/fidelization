import { Service } from "diod";

import { TenantRole } from "../../../memberships/domain/TenantRole";
import { Tenant } from "../../domain/Tenant";
import { TenantNotFound } from "../../domain/TenantNotFound";
import { TenantProfileForbidden } from "../../domain/TenantProfileForbidden";
import {
	parseTenantProfileUpdate,
	TenantProfileUpdateInput,
} from "../../domain/TenantProfileUpdate";
import { TenantRepository } from "../../domain/TenantRepository";

export type UpdateTenantProfileParams = {
	tenantId: string;
	role: TenantRole;
	profile: TenantProfileUpdateInput;
};

@Service()
export class UpdateTenantProfile {
	constructor(private readonly tenantRepository: TenantRepository) {}

	async execute(params: UpdateTenantProfileParams): Promise<Tenant> {
		if (params.role !== TenantRole.Owner) {
			throw new TenantProfileForbidden(params.role);
		}

		const profile = parseTenantProfileUpdate(params.profile);

		const existing = await this.tenantRepository.findById(params.tenantId);
		if (!existing) {
			throw new TenantNotFound(params.tenantId);
		}

		const updated = await this.tenantRepository.updateProfile(params.tenantId, profile);
		if (!updated) {
			throw new TenantNotFound(params.tenantId);
		}

		return updated;
	}
}
