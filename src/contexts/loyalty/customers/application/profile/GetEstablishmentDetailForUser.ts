import { Service } from "diod";

import { UserFinder } from "../../../../identity/users/application/find/UserFinder";
import {
	CrossTenantPromotionGroup,
	ListUserCrossTenantPromotions,
} from "../../../promotions/application/list/ListUserCrossTenantPromotions";
import { ListCustomerPromotionSummaries } from "../../../promotions/application/list/ListCustomerPromotionSummaries";
import { CustomerPromotionSummary } from "../../../promotions/domain/CustomerPromotionSummary";
import { Reward } from "../../../rewards/domain/Reward";
import { GENERIC_STAMP_VISIT_LABEL } from "../../../stamp_types/domain/StampType";
import { StampTypeRepository } from "../../../stamp_types/domain/StampTypeRepository";
import { StampCampaignRepository } from "../../../stamp_campaigns/domain/StampCampaignRepository";
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
	address: string | null;
	description: string | null;
	coverImageUrl: string | null;
};

export type GetEstablishmentDetailForUserParams = {
	userId: string;
	slug: string;
};

export type EstablishmentDetailResult = {
	mode: EstablishmentDetailMode;
	tenant: EstablishmentDetailTenant;
	promotions: CustomerPromotionSummary[];
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
		private readonly listCustomerPromotionSummaries: ListCustomerPromotionSummaries,
		private readonly getCustomerStampProgress: GetCustomerStampProgress,
		private readonly getCustomerActiveRewards: GetCustomerActiveRewards,
		private readonly listUserCrossTenantPromotions: ListUserCrossTenantPromotions,
		private readonly userFinder: UserFinder,
		private readonly stampCampaignRepository: StampCampaignRepository,
		private readonly stampTypeRepository: StampTypeRepository,
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

		const promotions = await this.listCustomerPromotionSummaries.execute({
			tenantId: tenant.id,
			customerId: customer?.id ?? null,
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
			address: primitives.address?.trim() ? primitives.address : null,
			description: primitives.description?.trim() ? primitives.description : null,
			coverImageUrl: primitives.coverImageUrl?.trim() ? primitives.coverImageUrl.trim() : null,
		};

		if (!customer) {
			const stampProgress = await this.buildStampCampaignPreview(tenant.id);

			return {
				mode: "discovery",
				tenant: tenantSummary,
				promotions,
				customer: null,
				stampProgress,
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

	private async buildStampCampaignPreview(tenantId: string): Promise<StampAddedSummary[]> {
		const campaigns = await this.stampCampaignRepository.listActiveByTenant(tenantId);
		const typeLabels = await this.loadStampTypeLabels(tenantId, campaigns);

		return campaigns.map((campaign) => ({
			campaignId: campaign.id,
			campaignName: campaign.name,
			current: 0,
			required: campaign.requiredStamps,
			completed: false,
			stampTypeId: campaign.stampTypeId,
			stampTypeLabel: campaign.stampTypeId
				? (typeLabels.get(campaign.stampTypeId) ?? GENERIC_STAMP_VISIT_LABEL)
				: GENERIC_STAMP_VISIT_LABEL,
			visualTemplate: campaign.visualTemplate,
			cardBackgroundVariant: campaign.cardBackgroundVariant,
			conditions: campaign.conditions,
		}));
	}

	private async loadStampTypeLabels(
		tenantId: string,
		campaigns: { stampTypeId: string | null }[],
	): Promise<Map<string, string>> {
		const ids = Array.from(
			new Set(
				campaigns
					.map((campaign) => campaign.stampTypeId)
					.filter((id): id is string => id !== null),
			),
		);
		const labels = new Map<string, string>();

		await Promise.all(
			ids.map(async (id) => {
				const stampType = await this.stampTypeRepository.searchById(tenantId, id);
				if (stampType) {
					labels.set(id, stampType.label);
				}
			}),
		);

		return labels;
	}
}
