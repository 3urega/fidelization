import { Service } from "diod";

import { Tenant } from "../../../tenants/tenants/domain/Tenant";
import { TenantRepository } from "../../../tenants/tenants/domain/TenantRepository";

@Service()
export class ListPlatformTenants {
	constructor(private readonly tenantRepository: TenantRepository) {}

	async execute(): Promise<Tenant[]> {
		return this.tenantRepository.findAll();
	}
}
