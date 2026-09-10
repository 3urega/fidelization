import { Service } from "diod";

import { AssertTenantPlanFeature } from "../../../../billing/subscriptions/application/guard/AssertTenantPlanFeature";
import { ListRecentRouletteSpinsForCustomer } from "../../../games/application/spin/ListRecentRouletteSpinsForCustomer";
import { ListCustomerPromotionSummaries } from "../../../promotions/application/list/ListCustomerPromotionSummaries";
import { TenantRole } from "../../../../tenants/memberships/domain/TenantRole";
import { TenantAccessSuspended } from "../../../../tenants/tenants/domain/TenantAccessSuspended";
import { TenantNotFound } from "../../../../tenants/tenants/domain/TenantNotFound";
import { TenantRepository } from "../../../../tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../../../../tenants/tenants/domain/TenantStatus";
import { GetCustomerStampProgress } from "../profile/GetCustomerStampProgress";
import type { CustomerDetailView } from "../../domain/analytics/CustomerDetail";
import { CustomerNotFound } from "../../domain/CustomerNotFound";
import { CustomerZoneForbidden } from "../../domain/analytics/CustomerZoneForbidden";
import { TenantCustomerAnalyticsRepository } from "../../domain/analytics/TenantCustomerAnalyticsRepository";
import { CustomerEngagementSnapshot } from "./CustomerEngagementSnapshot";

export type GetTenantCustomerDetailParams = {
	tenantId: string;
	customerId: string;
	role: TenantRole;
	referenceDate?: Date;
};

const CUSTOMER_ROULETTE_SPIN_HISTORY_LIMIT = 50;

@Service()
export class GetTenantCustomerDetail {
	constructor(
		private readonly tenantRepository: TenantRepository,
		private readonly tenantCustomerAnalyticsRepository: TenantCustomerAnalyticsRepository,
		private readonly getCustomerStampProgress: GetCustomerStampProgress,
		private readonly listCustomerPromotionSummaries: ListCustomerPromotionSummaries,
		private readonly assertTenantPlanFeature: AssertTenantPlanFeature,
		private readonly listRecentRouletteSpinsForCustomer: ListRecentRouletteSpinsForCustomer,
	) {}

	async execute(params: GetTenantCustomerDetailParams): Promise<CustomerDetailView> {
		if (params.role !== TenantRole.Owner) {
			throw new CustomerZoneForbidden(params.role);
		}

		await this.assertTenantAllowsLoyalty(params.tenantId);

		const referenceDate = params.referenceDate ?? new Date();
		const snapshot = await CustomerEngagementSnapshot.load(
			this.tenantCustomerAnalyticsRepository,
			params.tenantId,
			referenceDate,
		);
		const rawRow = snapshot.rawByCustomerId.get(params.customerId);
		const listRow = snapshot.listRows.find((row) => row.id === params.customerId);

		if (!rawRow || !listRow) {
			throw new CustomerNotFound(params.tenantId);
		}

		const [stampProgressRows, recentActivity, rewardsRedeemed, promotionSummaries, rouletteSpins] =
			await Promise.all([
				this.getCustomerStampProgress.execute({
					tenantId: params.tenantId,
					customerId: params.customerId,
				}),
				this.tenantCustomerAnalyticsRepository.loadRecentActivity(
					params.tenantId,
					params.customerId,
					20,
				),
				this.tenantCustomerAnalyticsRepository.loadRewardsRedeemed(
					params.tenantId,
					params.customerId,
				),
				this.listCustomerPromotionSummaries.execute({
					tenantId: params.tenantId,
					customerId: params.customerId,
				}),
				this.loadRouletteSpinHistory(params.tenantId, params.customerId),
			]);

		return {
			id: rawRow.customerId,
			name: rawRow.name,
			email: rawRow.email,
			phone: rawRow.phone,
			customerSince: rawRow.createdAt,
			visitsCount: rawRow.visitsCount,
			pointsBalance: rawRow.pointsBalance,
			status: listRow.status,
			stampProgress: stampProgressRows.map((row) => ({
				campaignId: row.campaignId,
				campaignName: row.campaignName,
				current: row.current,
				required: row.required,
				completed: row.completed,
				stampTypeLabel: row.stampTypeLabel,
			})),
			recentActivity,
			rewardsRedeemed,
			promotions: promotionSummaries.map((promotion) => ({
				id: promotion.id,
				title: promotion.title,
				type: promotion.type,
				isActive: promotion.isActive,
				usedCount: promotion.usedCount,
				maxUsesPerUser: promotion.maxUsesPerUser,
			})),
			rouletteSpins,
		};
	}

	private async loadRouletteSpinHistory(
		tenantId: string,
		customerId: string,
	): Promise<CustomerDetailView["rouletteSpins"]> {
		try {
			await this.assertTenantPlanFeature.execute({
				tenantId,
				feature: "gamification",
			});
		} catch {
			return [];
		}

		const rows = await this.listRecentRouletteSpinsForCustomer.execute({
			tenantId,
			customerId,
			limit: CUSTOMER_ROULETTE_SPIN_HISTORY_LIMIT,
		});

		return rows.map((row) => ({
			id: row.spinId,
			segmentLabel: row.segmentLabel,
			prizeType: row.prizeType,
			status: row.status,
			createdAt: new Date(row.createdAt),
			redeemedAt: row.redeemedAt ? new Date(row.redeemedAt) : null,
		}));
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
