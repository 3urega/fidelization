import { Service } from "diod";

import { Tenant } from "../../domain/Tenant";
import { TenantNotFound } from "../../domain/TenantNotFound";
import { TenantRepository } from "../../domain/TenantRepository";
import { TenantStatus } from "../../domain/TenantStatus";

@Service()
export class UpdateTenantStatus {
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
