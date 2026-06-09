import { Service } from "diod";

import { ListActivePromotionsForCustomer } from "../../../promotions/application/list/ListActivePromotionsForCustomer";
import { Promotion } from "../../../promotions/domain/Promotion";
import { TenantAccessSuspended } from "../../../../tenants/tenants/domain/TenantAccessSuspended";
import { TenantNotFound } from "../../../../tenants/tenants/domain/TenantNotFound";
import { TenantRepository } from "../../../../tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../../../../tenants/tenants/domain/TenantStatus";
import { Customer } from "../../domain/Customer";
import { CustomerRepository } from "../../domain/CustomerRepository";

export type EstablishmentDetailMode = "discovery" | "interaction";

export type EstablishmentDetailTenant = {
	id: string;
	name: string;
	slug: string;
	logoUrl: string | null;
	primaryColor: string | null;
	secondaryColor: string | null;
	subscriptionPlan: string;
	status: string;
};

export type GetEstablishmentDetailForUserParams = {
	userId: string;
	slug: string;
};

export type EstablishmentDetailResult = {
	mode: EstablishmentDetailMode;
	tenant: EstablishmentDetailTenant;
	promotions: Promotion[];
	customer: Customer | null;
};

@Service()
export class GetEstablishmentDetailForUser {
	constructor(
		private readonly tenantRepository: TenantRepository,
		private readonly customerRepository: CustomerRepository,
		private readonly listActivePromotionsForCustomer: ListActivePromotionsForCustomer,
	) {}

	async execute(params: GetEstablishmentDetailForUserParams): Promise<EstablishmentDetailResult> {
		const slug = params.slug.trim().toLowerCase();
		if (!slug) {
			throw new TenantNotFound(slug);
		}

		const tenant = await this.tenantRepository.findBySlug(slug);
		if (!tenant) {
			throw new TenantNotFound(slug);
		}

		if (tenant.status === TenantStatus.Suspended) {
			throw new TenantAccessSuspended(tenant.id);
		}

		const customer = await this.customerRepository.searchByUserIdAndTenantId(
			params.userId,
			tenant.id,
		);

		const promotions = await this.listActivePromotionsForCustomer.execute({
			tenantId: tenant.id,
		});

		const primitives = tenant.toPrimitives();

		return {
			mode: customer ? "interaction" : "discovery",
			tenant: {
				id: primitives.id,
				name: primitives.name,
				slug: primitives.slug,
				logoUrl: primitives.logoUrl || null,
				primaryColor: primitives.primaryColor || null,
				secondaryColor: primitives.secondaryColor || null,
				subscriptionPlan: primitives.subscriptionPlan,
				status: primitives.status,
			},
			promotions,
			customer,
		};
	}
}
