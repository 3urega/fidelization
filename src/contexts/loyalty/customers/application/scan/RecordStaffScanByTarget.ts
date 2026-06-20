import { Service } from "diod";

import { AssertTenantPlanFeature } from "../../../../billing/subscriptions/application/guard/AssertTenantPlanFeature";
import { LoyaltyTransaction } from "../../../loyalty_transactions/domain/LoyaltyTransaction";
import { LoyaltyTransactionRepository } from "../../../loyalty_transactions/domain/LoyaltyTransactionRepository";
import { TenantRole } from "../../../../tenants/memberships/domain/TenantRole";
import { TenantAccessSuspended } from "../../../../tenants/tenants/domain/TenantAccessSuspended";
import { TenantNotFound } from "../../../../tenants/tenants/domain/TenantNotFound";
import { TenantRepository } from "../../../../tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../../../../tenants/tenants/domain/TenantStatus";
import { Customer } from "../../domain/Customer";
import { CustomerRepository } from "../../domain/CustomerRepository";
import { StaffScanForbidden } from "../../domain/StaffScanForbidden";
import type { StaffScanOutcome } from "../../domain/StaffScanOutcome";
import { parseStaffScanTargetInput } from "../../domain/StaffScanTarget";
import { DEFAULT_POINTS_PER_VISIT } from "../../domain/StampProgressSummary";
import { ApplyCustomerLoyaltyOutcome } from "../loyalty/ApplyCustomerLoyaltyOutcome";
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
		private readonly applyLoyaltyOutcome: ApplyCustomerLoyaltyOutcome,
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
			const targetOutcomes = await this.applyLoyaltyOutcome.applyStamp({
				tenantId: params.tenantId,
				customerId: updated.id,
				campaignId: target.targetId,
				createdByUserId: params.createdByUserId,
				metadata: {
					qrValue: trimmedQr,
					source: "staff_scan",
					targetType: "stamp_campaign",
					targetId: target.targetId,
				},
			});
			outcomes.push(...targetOutcomes);
		} else {
			const promoResult = await this.applyLoyaltyOutcome.applyPromotion({
				tenantId: params.tenantId,
				customerId: updated.id,
				promotionId: target.targetId,
				createdByUserId: params.createdByUserId,
				metadata: {
					qrValue: trimmedQr,
					source: "staff_scan",
					targetType: "promotion",
					targetId: target.targetId,
				},
			});

			if (promoResult.applied) {
				outcomes.push({
					kind: "promotion_applied",
					promotionId: promoResult.promotionId,
					promotionTitle: promoResult.promotionTitle,
					usedCount: promoResult.usedCount,
					maxUsesPerUser: promoResult.maxUsesPerUser,
				});
			} else {
				outcomes.push({
					kind: "promotion_exhausted",
					promotionId: promoResult.promotionId,
					promotionTitle: promoResult.promotionTitle,
					maxUsesPerUser: promoResult.maxUsesPerUser ?? 0,
				});
			}
		}

		return { customer: updated, outcomes };
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
