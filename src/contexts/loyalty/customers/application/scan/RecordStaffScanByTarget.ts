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
import { TenantRole } from "../../../../tenants/memberships/domain/TenantRole";
import { TenantAccessSuspended } from "../../../../tenants/tenants/domain/TenantAccessSuspended";
import { TenantNotFound } from "../../../../tenants/tenants/domain/TenantNotFound";
import { TenantRepository } from "../../../../tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../../../../tenants/tenants/domain/TenantStatus";
import { Customer } from "../../domain/Customer";
import { CustomerRepository } from "../../domain/CustomerRepository";
import { InvalidStampScan } from "../../domain/InvalidStampScan";
import { StaffScanForbidden } from "../../domain/StaffScanForbidden";
import type { StaffScanOutcome } from "../../domain/StaffScanOutcome";
import { parseStaffScanTargetInput } from "../../domain/StaffScanTarget";
import { DEFAULT_POINTS_PER_VISIT } from "./RecordCustomerVisitByQr";
import { ResolveCustomerByQrForStaffScan } from "./ResolveCustomerByQrForStaffScan";

export type RecordStaffScanByTargetParams = {
	tenantId: string;
	qrValue: string;
	targetType: unknown;
	targetId: unknown;
	createdByUserId: string;
	staffRole: TenantRole;
	points?: number;
};

export type RecordStaffScanByTargetResult = {
	customer: Customer;
	outcomes: StaffScanOutcome[];
};

@Service()
export class RecordStaffScanByTarget {
	constructor(
		private readonly tenantRepository: TenantRepository,
		private readonly customerRepository: CustomerRepository,
		private readonly resolveCustomerByQr: ResolveCustomerByQrForStaffScan,
		private readonly loyaltyTransactionRepository: LoyaltyTransactionRepository,
		private readonly stampCampaignRepository: StampCampaignRepository,
		private readonly promotionRepository: PromotionRepository,
		private readonly customerPromotionUsageRepository: CustomerPromotionUsageRepository,
		private readonly assertTenantPlanFeature: AssertTenantPlanFeature,
	) {}

	async execute(params: RecordStaffScanByTargetParams): Promise<RecordStaffScanByTargetResult> {
		if (params.staffRole !== TenantRole.Owner && params.staffRole !== TenantRole.Employee) {
			throw new StaffScanForbidden(params.staffRole);
		}

		await this.assertTenantAllowsLoyalty(params.tenantId);

		const target = parseStaffScanTargetInput({
			targetType: params.targetType,
			targetId: params.targetId,
		});

		const trimmedQr = params.qrValue.trim();
		const customer = await this.resolveCustomerByQr.execute({
			tenantId: params.tenantId,
			qrValue: trimmedQr,
		});

		const points = params.points ?? DEFAULT_POINTS_PER_VISIT;
		const updated = customer.recordVisit(points);
		const pointsTransaction = LoyaltyTransaction.recordPointsEarned({
			tenantId: params.tenantId,
			customerId: updated.id,
			points,
			createdByUserId: params.createdByUserId,
			metadata: { qrValue: trimmedQr, source: "staff_scan" },
		});

		await this.customerRepository.save(updated);
		await this.loyaltyTransactionRepository.save(pointsTransaction);

		const outcomes: StaffScanOutcome[] = [
			{ kind: "point_recorded", pointsBalance: updated.pointsBalance },
		];

		if (target.targetType === "stamp_campaign") {
			const targetOutcomes = await this.applyStampCampaignTarget({
				tenantId: params.tenantId,
				customerId: updated.id,
				campaignId: target.targetId,
				createdByUserId: params.createdByUserId,
				qrValue: trimmedQr,
			});
			outcomes.push(...targetOutcomes);
		} else {
			const targetOutcomes = await this.applyPromotionTarget({
				tenantId: params.tenantId,
				customerId: updated.id,
				promotionId: target.targetId,
				createdByUserId: params.createdByUserId,
				qrValue: trimmedQr,
			});
			outcomes.push(...targetOutcomes);
		}

		return { customer: updated, outcomes };
	}

	private async applyStampCampaignTarget(params: {
		tenantId: string;
		customerId: string;
		campaignId: string;
		createdByUserId: string;
		qrValue: string;
	}): Promise<StaffScanOutcome[]> {
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
				createdByUserId: params.createdByUserId,
				metadata: {
					campaignId: campaign.id,
					campaignName: campaign.name,
					stampTypeId: campaign.stampTypeId,
					source: "staff_scan",
					qrValue: params.qrValue,
					targetType: "stamp_campaign",
					targetId: campaign.id,
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

	private async applyPromotionTarget(params: {
		tenantId: string;
		customerId: string;
		promotionId: string;
		createdByUserId: string;
		qrValue: string;
	}): Promise<StaffScanOutcome[]> {
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
			return [
				{
					kind: "promotion_exhausted",
					promotionId: promotion.id,
					promotionTitle: promotion.title,
					maxUsesPerUser: maxUses,
				},
			];
		}

		const nextUsage = existing.increment();
		await this.customerPromotionUsageRepository.saveUsage(nextUsage);
		await this.loyaltyTransactionRepository.save(
			LoyaltyTransaction.recordPromotionUsed({
				tenantId: params.tenantId,
				customerId: params.customerId,
				createdByUserId: params.createdByUserId,
				metadata: {
					promotionId: promotion.id,
					promotionTitle: promotion.title,
					usedCount: nextUsage.usedCount,
					maxUsesPerUser: maxUses,
					qrValue: params.qrValue,
					source: "staff_scan",
					targetType: "promotion",
					targetId: promotion.id,
				},
			}),
		);

		return [
			{
				kind: "promotion_applied",
				promotionId: promotion.id,
				promotionTitle: promotion.title,
				usedCount: nextUsage.usedCount,
				maxUsesPerUser: maxUses,
			},
		];
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
