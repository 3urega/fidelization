import { Service } from "diod";

import { UserRepository } from "../../../../identity/users/domain/UserRepository";
import { AssertTenantPlanFeature } from "../../../../billing/subscriptions/application/guard/AssertTenantPlanFeature";
import { LoyaltyTransaction } from "../../../loyalty_transactions/domain/LoyaltyTransaction";
import { LoyaltyTransactionRepository } from "../../../loyalty_transactions/domain/LoyaltyTransactionRepository";
import { CustomerPromotionSummary, customerPromotionSummaryFromPromotion } from "../../../promotions/domain/CustomerPromotionSummary";
import { CustomerPromotionUsage } from "../../../promotions/domain/CustomerPromotionUsage";
import { CustomerPromotionUsageRepository } from "../../../promotions/domain/CustomerPromotionUsageRepository";
import { InvalidPromotion } from "../../../promotions/domain/InvalidPromotion";
import { PromotionNotFound } from "../../../promotions/domain/PromotionNotFound";
import { PromotionRepository } from "../../../promotions/domain/PromotionRepository";
import { PromotionUsageLimitReached } from "../../../promotions/domain/PromotionUsageLimitReached";
import { TenantRole } from "../../../../tenants/memberships/domain/TenantRole";
import { TenantAccessSuspended } from "../../../../tenants/tenants/domain/TenantAccessSuspended";
import { TenantNotFound } from "../../../../tenants/tenants/domain/TenantNotFound";
import { TenantRepository } from "../../../../tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../../../../tenants/tenants/domain/TenantStatus";
import { Customer } from "../../domain/Customer";
import { CustomerNotFound } from "../../domain/CustomerNotFound";
import { CustomerRepository } from "../../domain/CustomerRepository";

export type RecordPromotionUseParams = {
	tenantId: string;
	promotionId: string;
	qrValue: string;
	createdByUserId: string;
	staffRole: TenantRole;
};

export type RecordPromotionUseResult = {
	summary: CustomerPromotionSummary;
	customer: Customer;
};

@Service()
export class RecordPromotionUse {
	constructor(
		private readonly tenantRepository: TenantRepository,
		private readonly customerRepository: CustomerRepository,
		private readonly userRepository: UserRepository,
		private readonly promotionRepository: PromotionRepository,
		private readonly customerPromotionUsageRepository: CustomerPromotionUsageRepository,
		private readonly loyaltyTransactionRepository: LoyaltyTransactionRepository,
		private readonly assertTenantPlanFeature: AssertTenantPlanFeature,
	) {}

	async execute(params: RecordPromotionUseParams): Promise<RecordPromotionUseResult> {
		if (params.staffRole !== TenantRole.Owner && params.staffRole !== TenantRole.Employee) {
			throw new InvalidPromotion("Only tenant staff can record promotion use");
		}

		await this.assertTenantAllowsLoyalty(params.tenantId);
		await this.assertTenantPlanFeature.execute({
			tenantId: params.tenantId,
			feature: "promotions",
		});

		const promotion = await this.promotionRepository.searchById(params.tenantId, params.promotionId);
		if (!promotion) {
			throw new PromotionNotFound(params.promotionId);
		}

		this.assertPromotionIsActiveNow(promotion);

		const trimmedQr = params.qrValue.trim();
		const customer = await this.resolveCustomerByQr(params.tenantId, trimmedQr);

		const existing =
			(await this.customerPromotionUsageRepository.searchUsage(
				params.tenantId,
				customer.id,
				promotion.id,
			)) ??
			CustomerPromotionUsage.start({
				tenantId: params.tenantId,
				customerId: customer.id,
				promotionId: promotion.id,
			});

		const maxUses = promotion.maxUsesPerUser;
		if (maxUses !== null && existing.usedCount >= maxUses) {
			throw new PromotionUsageLimitReached(promotion.id, maxUses);
		}

		const nextUsage = existing.increment();
		await this.customerPromotionUsageRepository.saveUsage(nextUsage);
		await this.loyaltyTransactionRepository.save(
			LoyaltyTransaction.recordPromotionUsed({
				tenantId: params.tenantId,
				customerId: customer.id,
				createdByUserId: params.createdByUserId,
				metadata: {
					promotionId: promotion.id,
					promotionTitle: promotion.title,
					usedCount: nextUsage.usedCount,
					maxUsesPerUser: maxUses,
					qrValue: trimmedQr,
					source: "staff_promotion_use",
				},
			}),
		);

		return {
			customer,
			summary: customerPromotionSummaryFromPromotion(promotion, nextUsage.usedCount),
		};
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

	private async resolveCustomerByQr(tenantId: string, qrValue: string): Promise<Customer> {
		const byCustomerQr = await this.customerRepository.searchByQrValue(tenantId, qrValue);
		if (byCustomerQr) {
			return byCustomerQr;
		}

		const user = await this.userRepository.searchByQrValue(qrValue);
		if (!user) {
			throw new CustomerNotFound(tenantId);
		}

		const linked = await this.customerRepository.searchByUserIdAndTenantId(
			user.id.value,
			tenantId,
		);
		if (!linked) {
			throw new CustomerNotFound(tenantId);
		}

		return linked;
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
