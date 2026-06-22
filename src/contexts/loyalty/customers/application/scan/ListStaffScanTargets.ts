import { Service } from "diod";

import { AssertTenantPlanFeature } from "../../../../billing/subscriptions/application/guard/AssertTenantPlanFeature";
import { ResolveTenantSubscriptionPlan } from "../../../../billing/subscriptions/application/resolve/ResolveTenantSubscriptionPlan";
import { isPlanFeatureEnabled } from "../../../../billing/subscriptions/domain/TenantPlanFeature";
import { GetTenantRouletteConfig } from "../../../games/application/config/GetTenantRouletteConfig";
import {
	getParticipationRules,
	usesStaffExplicitAuthorization,
} from "../../../games/domain/RouletteConfig";
import { RULETA_GAME_SLUG } from "../../../games/domain/TenantGameActivation";
import { GENERIC_STAMP_VISIT_LABEL } from "../../../stamp_types/domain/StampType";
import { StampTypeRepository } from "../../../stamp_types/domain/StampTypeRepository";
import { StampCampaign } from "../../../stamp_campaigns/domain/StampCampaign";
import { StampCampaignRepository } from "../../../stamp_campaigns/domain/StampCampaignRepository";
import { PromotionRepository } from "../../../promotions/domain/PromotionRepository";
import { TenantRole } from "../../../../tenants/memberships/domain/TenantRole";
import { TenantAccessSuspended } from "../../../../tenants/tenants/domain/TenantAccessSuspended";
import { TenantNotFound } from "../../../../tenants/tenants/domain/TenantNotFound";
import { TenantRepository } from "../../../../tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../../../../tenants/tenants/domain/TenantStatus";
import { StaffScanForbidden } from "../../domain/StaffScanForbidden";
import type {
	StaffScanCampaignTarget,
	StaffScanPromotionTarget,
	StaffScanTargets,
} from "../../domain/StaffScanTargets";

export type ListStaffScanTargetsParams = {
	tenantId: string;
	role: TenantRole;
};

@Service()
export class ListStaffScanTargets {
	constructor(
		private readonly tenantRepository: TenantRepository,
		private readonly stampCampaignRepository: StampCampaignRepository,
		private readonly stampTypeRepository: StampTypeRepository,
		private readonly promotionRepository: PromotionRepository,
		private readonly resolveTenantSubscriptionPlan: ResolveTenantSubscriptionPlan,
		private readonly assertTenantPlanFeature: AssertTenantPlanFeature,
		private readonly getTenantRouletteConfig: GetTenantRouletteConfig,
	) {}

	async execute(params: ListStaffScanTargetsParams): Promise<StaffScanTargets> {
		if (params.role !== TenantRole.Owner && params.role !== TenantRole.Employee) {
			throw new StaffScanForbidden(params.role);
		}

		await this.assertTenantAllowsLoyalty(params.tenantId);

		const campaigns = await this.stampCampaignRepository.listActiveByTenant(params.tenantId);
		const typeLabels = await this.loadTypeLabels(params.tenantId, campaigns);

		const stampCampaigns: StaffScanCampaignTarget[] = campaigns.map((campaign) => ({
			id: campaign.id,
			name: campaign.name,
			requiredStamps: campaign.requiredStamps,
			visualTemplate: campaign.visualTemplate,
			cardBackgroundVariant: campaign.cardBackgroundVariant,
			stampTypeLabel: campaign.stampTypeId
				? (typeLabels.get(campaign.stampTypeId) ?? GENERIC_STAMP_VISIT_LABEL)
				: GENERIC_STAMP_VISIT_LABEL,
			conditions: campaign.conditions,
		}));

		const promotions = await this.listPromotionTargets(params.tenantId);
		const rouletteAuthorize = await this.resolveRouletteAuthorizeTarget(params.tenantId);

		return { stampCampaigns, promotions, rouletteAuthorize };
	}

	private async resolveRouletteAuthorizeTarget(
		tenantId: string,
	): Promise<StaffScanTargets["rouletteAuthorize"]> {
		try {
			await this.assertTenantPlanFeature.execute({
				tenantId,
				feature: "gamification",
			});
		} catch {
			return { enabled: false, minPurchaseEuros: null };
		}

		const activation = await this.getTenantRouletteConfig.execute({
			tenantId,
			gameSlug: RULETA_GAME_SLUG,
		});

		if (
			!activation.isEnabled ||
			!activation.config ||
			!usesStaffExplicitAuthorization(activation.config)
		) {
			return { enabled: false, minPurchaseEuros: null };
		}

		const rules = getParticipationRules(activation.config);

		return {
			enabled: true,
			minPurchaseEuros: rules.minPurchaseEuros,
		};
	}

	private async listPromotionTargets(tenantId: string): Promise<StaffScanPromotionTarget[]> {
		const plan = await this.resolveTenantSubscriptionPlan.execute(tenantId);
		if (!isPlanFeatureEnabled(plan.features, "promotions")) {
			return [];
		}

		const promotions = await this.promotionRepository.listActiveByTenantAt(tenantId, new Date());

		return promotions.map((promotion) => {
			const primitives = promotion.toPrimitives();

			return {
				id: primitives.id,
				title: primitives.title,
				description: primitives.description,
				maxUsesPerUser: primitives.maxUsesPerUser,
			};
		});
	}

	private async loadTypeLabels(
		tenantId: string,
		campaigns: StampCampaign[],
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
