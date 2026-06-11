import { Service } from "diod";

import { TenantRole } from "../../../../tenants/memberships/domain/TenantRole";
import { TenantAccessSuspended } from "../../../../tenants/tenants/domain/TenantAccessSuspended";
import { TenantNotFound } from "../../../../tenants/tenants/domain/TenantNotFound";
import { TenantRepository } from "../../../../tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../../../../tenants/tenants/domain/TenantStatus";
import { resolveUniqueStampTypeSlug } from "../resolveUniqueStampTypeSlug";
import { StampType } from "../../domain/StampType";
import { parseStampTypeCreate } from "../../domain/StampTypeCreateInput";
import { StampTypeForbidden } from "../../domain/StampTypeForbidden";
import { StampTypeRepository } from "../../domain/StampTypeRepository";

export type CreateStampTypeParams = {
	tenantId: string;
	role: TenantRole;
	input: {
		label?: string;
	};
};

@Service()
export class CreateStampType {
	constructor(
		private readonly tenantRepository: TenantRepository,
		private readonly stampTypeRepository: StampTypeRepository,
	) {}

	async execute(params: CreateStampTypeParams): Promise<StampType> {
		if (params.role !== TenantRole.Owner) {
			throw new StampTypeForbidden(params.role);
		}

		await this.assertTenantAllowsLoyalty(params.tenantId);

		const parsed = parseStampTypeCreate(params.input);
		const slug = await resolveUniqueStampTypeSlug(
			this.stampTypeRepository,
			params.tenantId,
			parsed.label,
		);
		const sortOrder = (await this.stampTypeRepository.maxSortOrder(params.tenantId)) + 1;

		const stampType = StampType.create({
			tenantId: params.tenantId,
			label: parsed.label,
			slug,
			sortOrder,
		});

		await this.stampTypeRepository.save(stampType);

		return stampType;
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
