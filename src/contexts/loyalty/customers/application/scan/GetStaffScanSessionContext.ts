import { Service } from "diod";

import { AssertTenantPlanFeature } from "../../../../billing/subscriptions/application/guard/AssertTenantPlanFeature";
import { ResolveTenantSubscriptionPlan } from "../../../../billing/subscriptions/application/resolve/ResolveTenantSubscriptionPlan";
import { isPlanFeatureEnabled } from "../../../../billing/subscriptions/domain/TenantPlanFeature";
import { GetStaffRouletteScanContext } from "../../../games/application/config/GetStaffRouletteScanContext";
import { GetRouletteParticipationState } from "../../../games/application/participation/GetRouletteParticipationState";
import { RouletteSpinRepository } from "../../../games/domain/RouletteSpinRepository";
import { ListCustomerPromotionSummaries } from "../../../promotions/application/list/ListCustomerPromotionSummaries";
import { TenantRole } from "../../../../tenants/memberships/domain/TenantRole";
import { TenantAccessSuspended } from "../../../../tenants/tenants/domain/TenantAccessSuspended";
import { TenantNotFound } from "../../../../tenants/tenants/domain/TenantNotFound";
import { TenantRepository } from "../../../../tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../../../../tenants/tenants/domain/TenantStatus";
import { GetCustomerStampProgress } from "../profile/GetCustomerStampProgress";
import { Customer } from "../../domain/Customer";
import { CustomerNotFound } from "../../domain/CustomerNotFound";
import { CustomerRepository } from "../../domain/CustomerRepository";
import { InvalidStampScan } from "../../domain/InvalidStampScan";
import {
	resolveStaffScanPromotion,
	resolveStaffScanStampCard,
	type StaffScanSessionView,
} from "../../domain/StaffScanSession";
import { StaffScanForbidden } from "../../domain/StaffScanForbidden";
import { ResolveCustomerByQrForStaffScan } from "./ResolveCustomerByQrForStaffScan";

export type GetStaffScanSessionContextParams = {
	tenantId: string;
	role: TenantRole;
	qrValue?: string;
	customerId?: string;
};

@Service()
export class GetStaffScanSessionContext {
	constructor(
		private readonly tenantRepository: TenantRepository,
		private readonly customerRepository: CustomerRepository,
		private readonly resolveCustomerByQr: ResolveCustomerByQrForStaffScan,
		private readonly getCustomerStampProgress: GetCustomerStampProgress,
		private readonly listCustomerPromotionSummaries: ListCustomerPromotionSummaries,
		private readonly resolveTenantSubscriptionPlan: ResolveTenantSubscriptionPlan,
		private readonly assertTenantPlanFeature: AssertTenantPlanFeature,
		private readonly getStaffRouletteScanContext: GetStaffRouletteScanContext,
		private readonly getRouletteParticipationState: GetRouletteParticipationState,
		private readonly rouletteSpinRepository: RouletteSpinRepository,
	) {}

	async execute(params: GetStaffScanSessionContextParams): Promise<StaffScanSessionView> {
		if (params.role !== TenantRole.Owner && params.role !== TenantRole.Employee) {
			throw new StaffScanForbidden(params.role);
		}

		await this.assertTenantAllowsLoyalty(params.tenantId);

		const trimmedQr = params.qrValue?.trim() ?? "";
		const customerIdParam = params.customerId?.trim() ?? "";
		const hasQr = trimmedQr.length > 0;
		const hasCustomerId = customerIdParam.length > 0;

		if (hasQr === hasCustomerId) {
			throw new InvalidStampScan("Exactly one of qrValue or customerId is required");
		}

		const customer = hasQr
			? await this.resolveCustomerByQr.execute({
					tenantId: params.tenantId,
					qrValue: trimmedQr,
				})
			: await this.loadCustomerById(params.tenantId, customerIdParam);

		const customerPrimitives = customer.toPrimitives();

		const plan = await this.resolveTenantSubscriptionPlan.execute(params.tenantId);
		const promotionsEnabled = isPlanFeatureEnabled(plan.features, "promotions");
		let gamificationEnabled = false;

		try {
			await this.assertTenantPlanFeature.execute({
				tenantId: params.tenantId,
				feature: "gamification",
			});
			gamificationEnabled = true;
		} catch {
			gamificationEnabled = false;
		}

		const [stampProgressRows, promotionSummaries, rouletteTenantContext] = await Promise.all([
			this.getCustomerStampProgress.execute({
				tenantId: params.tenantId,
				customerId: customerPrimitives.id,
			}),
			this.listCustomerPromotionSummaries.execute({
				tenantId: params.tenantId,
				customerId: customerPrimitives.id,
			}),
			gamificationEnabled
				? this.getStaffRouletteScanContext.execute({ tenantId: params.tenantId })
				: Promise.resolve(null),
		]);

		const stampCards = stampProgressRows.map(resolveStaffScanStampCard);
		const promotions = promotionSummaries.map((promotion) =>
			resolveStaffScanPromotion({
				id: promotion.id,
				title: promotion.title,
				description: promotion.description,
				maxUsesPerUser: promotion.maxUsesPerUser,
				usedCount: promotion.usedCount,
				isActive: promotion.isActive,
			}),
		);

		let roulette: StaffScanSessionView["roulette"] = null;

		if (gamificationEnabled && rouletteTenantContext) {
			const [participation, pendingSpins] = await Promise.all([
				this.getRouletteParticipationState.execute({
					tenantId: params.tenantId,
					customerId: customerPrimitives.id,
				}),
				this.rouletteSpinRepository.listPendingRedeemByCustomer(
					params.tenantId,
					customerPrimitives.id,
				),
			]);

			roulette = {
				participation,
				pendingPhysicalCount: pendingSpins.length,
			};
		}

		const rouletteCapabilities =
			gamificationEnabled && rouletteTenantContext
				? {
						unlockEnabled: rouletteTenantContext.unlockEnabled,
						authorizeEnabled: rouletteTenantContext.authorizeEnabled,
						minPurchaseEuros: rouletteTenantContext.minPurchaseEuros,
					}
				: null;

		return {
			customer: {
				id: customerPrimitives.id,
				name: customerPrimitives.name,
				pointsBalance: customerPrimitives.pointsBalance,
				visitsCount: customerPrimitives.visitsCount,
			},
			tenantCapabilities: {
				stampCampaignsEnabled: stampCards.length > 0,
				promotionsEnabled,
				roulette: rouletteCapabilities,
				physicalRedeemEnabled: gamificationEnabled,
			},
			stampCards,
			promotions,
			roulette,
		};
	}

	private async loadCustomerById(tenantId: string, customerId: string): Promise<Customer> {
		const customer = await this.customerRepository.searchById(tenantId, customerId);

		if (!customer) {
			throw new CustomerNotFound(tenantId);
		}

		return customer;
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
