import { Service } from "diod";

import { TenantNotFound } from "../../../tenants/tenants/domain/TenantNotFound";
import type { PlatformTenantDetail } from "../../domain/PlatformTenantDetail";
import { PlatformTenantDetailReadRepository } from "../../domain/PlatformTenantDetailReadRepository";

@Service()
export class GetPlatformTenantDetail {
	constructor(private readonly repository: PlatformTenantDetailReadRepository) {}

	async execute(tenantId: string): Promise<PlatformTenantDetail> {
		const detail = await this.repository.getById(tenantId);

		if (!detail) {
			throw new TenantNotFound(tenantId);
		}

		return detail;
	}
}
