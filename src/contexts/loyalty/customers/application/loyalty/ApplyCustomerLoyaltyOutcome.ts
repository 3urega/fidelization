import { Service } from "diod";

import { AssertTenantPlanFeature } from "../../../../billing/subscriptions/application/guard/AssertTenantPlanFeature";
import { LoyaltyTransaction } from "../../../loyalty_transactions/domain/LoyaltyTransaction";
import { LoyaltyTransactionRepository } from "../../../loyalty_transactions/domain/LoyaltyTransactionRepository";
import { CustomerPromotionUsage } from "../../../promotions/domain/CustomerPromotionUsage";
import { CustomerPromotionUsageRepository } from "../../../promotions/domain/CustomerPromotionUsageRepository";
import { InvalidPromotion } from "../../../promotions/domain/InvalidPromotion";
import { PromotionNotFound } from "../../../promotions/domain/PromotionNotFound";
import { PromotionRepository } from "../../../promotions/domain/PromotionRepository";
import { CustomerStampProgress } from "../../../stamp_campaigns/domain/CustomerStampProgress";
import { StampCampaignRepository } from "../../../stamp_campaigns/domain/StampCampaignRepository";
import { Customer } from "../../domain/Customer";
import { CustomerRepository } from "../../domain/CustomerRepository";
import { CustomerNotFound } from "../../domain/CustomerNotFound";
import { InvalidStampScan } from "../../domain/InvalidStampScan";
import type { StaffScanOutcome } from "../../domain/StaffScanOutcome";

export type ApplyPointsParams = {
	tenantId: string;
	customerId: string;
	points: number;
	createdByUserId?: string | null;
	metadata?: Record<string, unknown>;
};

export type ApplyStampParams = {
	tenantId: string;
	customerId: string;
	campaignId: string;
	createdByUserId?: string | null;
	metadata?: Record<string, unknown>;
};

export type ApplyPromotionParams = {
	tenantId: string;
	customerId: string;
	promotionId: string;
	createdByUserId?: string | null;
	metadata?: Record<string, unknown>;
};

export type ApplyPromotionResult = {
	applied: boolean;
	promotionId: string;
	promotionTitle: string;
	usedCount: number;
	maxUsesPerUser: number | null;
};

@Service()
export class ApplyCustomerLoyaltyOutcome {
	constructor(
		private readonly customerRepository: CustomerRepository,
		private readonly loyaltyTransactionRepository: LoyaltyTransactionRepository,
		private readonly stampCampaignRepository: StampCampaignRepository,
		private readonly promotionRepository: PromotionRepository,
		private readonly customerPromotionUsageRepository: CustomerPromotionUsageRepository,
		private readonly assertTenantPlanFeature: AssertTenantPlanFeature,
	) {}

	async applyPoints(params: ApplyPointsParams): Promise<Customer> {
		const customer = await this.loadCustomer(params.tenantId, params.customerId);
		const updated = customer.earnPoints(params.points);

		await this.customerRepository.save(updated);
		await this.loyaltyTransactionRepository.save(
			LoyaltyTransaction.recordPointsEarned({
				tenantId: params.tenantId,
				customerId: params.customerId,
				points: params.points,
				createdByUserId: params.createdByUserId ?? null,
				metadata: params.metadata,
			}),
		);

		return updated;
	}

	async applyStamp(params: ApplyStampParams): Promise<StaffScanOutcome[]> {
		const campaign = await this.stampCampaignRepository.searchCampaignById(
			params.tenantId,
			params.campaignId,
		);

		if (!campaign || !campaign.isActive) {
			throw new InvalidStampScan(`Campaign ${params.campaignId} is not an active scan target`);
		}

		const existing = await this.stampCampaignRepository.searchProgress(
			params.tenantId,
			params.customerId,
			campaign.id,
		);

		if (existing?.completed) {
			return [
				{
					kind: "card_already_completed",
					campaignId: campaign.id,
					campaignName: campaign.name,
				},
			];
		}

		const progress =
			existing ??
			CustomerStampProgress.start({
				tenantId: params.tenantId,
				customerId: params.customerId,
				campaignId: campaign.id,
			});

		const { progress: nextProgress, added } = progress.addStamp(campaign.requiredStamps);

		if (!added) {
			return [
				{
					kind: "card_already_completed",
					campaignId: campaign.id,
					campaignName: campaign.name,
				},
			];
		}

		await this.stampCampaignRepository.saveProgress(nextProgress);
		await this.loyaltyTransactionRepository.save(
			LoyaltyTransaction.recordStampAdded({
				tenantId: params.tenantId,
				customerId: params.customerId,
				createdByUserId: params.createdByUserId ?? null,
				metadata: {
					campaignId: campaign.id,
					campaignName: campaign.name,
					stampTypeId: campaign.stampTypeId,
					...params.metadata,
				},
			}),
		);

		const outcomes: StaffScanOutcome[] = [
			{
				kind: "stamp_added",
				campaignId: campaign.id,
				campaignName: campaign.name,
				current: nextProgress.currentStamps,
				required: campaign.requiredStamps,
			},
		];

		if (nextProgress.completed) {
			outcomes.push({
				kind: "card_completed",
				campaignId: campaign.id,
				campaignName: campaign.name,
			});
		}

		return outcomes;
	}

	async applyPromotion(params: ApplyPromotionParams): Promise<ApplyPromotionResult> {
		await this.assertTenantPlanFeature.execute({
			tenantId: params.tenantId,
			feature: "promotions",
		});

		const promotion = await this.promotionRepository.searchById(
			params.tenantId,
			params.promotionId,
		);

		if (!promotion) {
			throw new PromotionNotFound(params.promotionId);
		}

		this.assertPromotionIsActiveNow(promotion);

		const existing =
			(await this.customerPromotionUsageRepository.searchUsage(
				params.tenantId,
				params.customerId,
				promotion.id,
			)) ??
			CustomerPromotionUsage.start({
				tenantId: params.tenantId,
				customerId: params.customerId,
				promotionId: promotion.id,
			});

		const maxUses = promotion.maxUsesPerUser;

		if (maxUses !== null && existing.usedCount >= maxUses) {
			return {
				applied: false,
				promotionId: promotion.id,
				promotionTitle: promotion.title,
				usedCount: existing.usedCount,
				maxUsesPerUser: maxUses,
			};
		}

		const nextUsage = existing.increment();
		await this.customerPromotionUsageRepository.saveUsage(nextUsage);
		await this.loyaltyTransactionRepository.save(
			LoyaltyTransaction.recordPromotionUsed({
				tenantId: params.tenantId,
				customerId: params.customerId,
				createdByUserId: params.createdByUserId ?? null,
				metadata: {
					promotionId: promotion.id,
					promotionTitle: promotion.title,
					usedCount: nextUsage.usedCount,
					maxUsesPerUser: maxUses,
					...params.metadata,
				},
			}),
		);

		return {
			applied: true,
			promotionId: promotion.id,
			promotionTitle: promotion.title,
			usedCount: nextUsage.usedCount,
			maxUsesPerUser: maxUses,
		};
	}

	private async loadCustomer(tenantId: string, customerId: string): Promise<Customer> {
		const customer = await this.customerRepository.searchById(tenantId, customerId);

		if (!customer) {
			throw new CustomerNotFound(tenantId);
		}

		return customer;
	}

	private assertPromotionIsActiveNow(promotion: {
		isActive: boolean;
		startDate: Date | null;
		endDate: Date | null;
		id: string;
	}): void {
		if (!promotion.isActive) {
			throw new InvalidPromotion(`Promotion ${promotion.id} is not active`);
		}

		const now = new Date();

		if (promotion.startDate && promotion.startDate > now) {
			throw new InvalidPromotion(`Promotion ${promotion.id} has not started yet`);
		}

		if (promotion.endDate && promotion.endDate < now) {
			throw new InvalidPromotion(`Promotion ${promotion.id} has expired`);
		}
	}
}
