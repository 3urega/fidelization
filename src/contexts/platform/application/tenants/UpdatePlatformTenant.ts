import { Service } from "diod";

import { slugifyBusinessName } from "../../../../lib/tenant/slugifyBusinessName";
import { Tenant } from "../../../tenants/tenants/domain/Tenant";
import { TenantNotFound } from "../../../tenants/tenants/domain/TenantNotFound";
import type { TenantPlatformProfileUpdate } from "../../../tenants/tenants/domain/TenantPlatformProfileUpdate";
import { TenantRepository } from "../../../tenants/tenants/domain/TenantRepository";
import { TenantSlugAlreadyExists } from "../../../tenants/tenants/domain/TenantSlugAlreadyExists";

export type UpdatePlatformTenantParams = {
	tenantId: string;
	name?: string;
	slug?: string;
};

@Service()
export class UpdatePlatformTenant {
	constructor(private readonly tenantRepository: TenantRepository) {}

	async execute(params: UpdatePlatformTenantParams): Promise<Tenant> {
		const existing = await this.tenantRepository.findById(params.tenantId);

		if (!existing) {
			throw new TenantNotFound(params.tenantId);
		}

		const update: TenantPlatformProfileUpdate = {};

		if (params.name !== undefined) {
			const name = params.name.trim();
			if (!name) {
				throw new Error("name cannot be empty");
			}

			update.name = name;
		}

		if (params.slug !== undefined) {
			const slug = slugifyBusinessName(params.slug.trim());
			if (slug !== existing.slug) {
				const taken = await this.tenantRepository.findBySlug(slug);
				if (taken && taken.id !== params.tenantId) {
					throw new TenantSlugAlreadyExists(slug);
				}

				update.slug = slug;
			}
		}

		if (update.name === undefined && update.slug === undefined) {
			return existing;
		}

		const updated = await this.tenantRepository.updatePlatformProfile(params.tenantId, update);

		if (!updated) {
			throw new TenantNotFound(params.tenantId);
		}

		return updated;
	}
}
