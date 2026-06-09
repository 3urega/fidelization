import { Service } from "diod";

import { UserFinder } from "../../../../identity/users/application/find/UserFinder";
import {
	CrossTenantPromotionGroup,
	ListUserCrossTenantPromotions,
} from "../../../promotions/application/list/ListUserCrossTenantPromotions";
import { ListActivePromotionsForCustomer } from "../../../promotions/application/list/ListActivePromotionsForCustomer";
import { Promotion } from "../../../promotions/domain/Promotion";
import { Reward } from "../../../rewards/domain/Reward";
import { GetCustomerActiveRewards } from "./GetCustomerActiveRewards";
import { GetCustomerStampProgress } from "./GetCustomerStampProgress";
import { StampAddedSummary } from "../scan/RecordCustomerVisitByQr";
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
	stampProgress: StampAddedSummary[];
	rewards: Reward[];
	userQrValue: string | null;
	otherPromotions: CrossTenantPromotionGroup[];
};

@Service()
export class GetEstablishmentDetailForUser {
	constructor(
		private readonly tenantRepository: TenantRepository,
		private readonly customerRepository: CustomerRepository,
		private readonly listActivePromotionsForCustomer: ListActivePromotionsForCustomer,
		private readonly getCustomerStampProgress: GetCustomerStampProgress,
		private readonly getCustomerActiveRewards: GetCustomerActiveRewards,
		private readonly listUserCrossTenantPromotions: ListUserCrossTenantPromotions,
		private readonly userFinder: UserFinder,
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
		const tenantSummary: EstablishmentDetailTenant = {
			id: primitives.id,
			name: primitives.name,
			slug: primitives.slug,
			logoUrl: primitives.logoUrl || null,
			primaryColor: primitives.primaryColor || null,
			secondaryColor: primitives.secondaryColor || null,
			subscriptionPlan: primitives.subscriptionPlan,
			status: primitives.status,
		};

		if (!customer) {
			return {
				mode: "discovery",
				tenant: tenantSummary,
				promotions,
				customer: null,
				stampProgress: [],
				rewards: [],
				userQrValue: null,
				otherPromotions: [],
			};
		}

		const user = await this.userFinder.find(params.userId);

		const [stampProgress, rewards, otherPromotions] = await Promise.all([
			this.getCustomerStampProgress.execute({
				tenantId: tenant.id,
				customerId: customer.id,
			}),
			this.getCustomerActiveRewards.execute({ tenantId: tenant.id }),
			this.listUserCrossTenantPromotions.execute({
				userId: params.userId,
				excludeTenantSlug: slug,
			}),
		]);

		return {
			mode: "interaction",
			tenant: tenantSummary,
			promotions,
			customer,
			stampProgress,
			rewards,
			userQrValue: user.qrValue,
			otherPromotions,
		};
	}
}
