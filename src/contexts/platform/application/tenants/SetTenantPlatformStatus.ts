import { Service } from "diod";

import { Tenant } from "../../../tenants/tenants/domain/Tenant";
import { TenantNotFound } from "../../../tenants/tenants/domain/TenantNotFound";
import { TenantRepository } from "../../../tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../../../tenants/tenants/domain/TenantStatus";

@Service()
export class SetTenantPlatformStatus {
	constructor(private readonly tenantRepository: TenantRepository) {}

	async execute(tenantId: string, status: TenantStatus): Promise<Tenant> {
		const existing = await this.tenantRepository.findById(tenantId);

		if (!existing) {
			throw new TenantNotFound(tenantId);
		}

		const updated = await this.tenantRepository.updateStatus(tenantId, status);

		if (!updated) {
			throw new TenantNotFound(tenantId);
		}

		return updated;
	}
}
