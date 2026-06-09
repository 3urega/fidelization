import { Service } from "diod";

import { UserRepository } from "../../../../identity/users/domain/UserRepository";
import { LoyaltyTransaction } from "../../../loyalty_transactions/domain/LoyaltyTransaction";
import { LoyaltyTransactionRepository } from "../../../loyalty_transactions/domain/LoyaltyTransactionRepository";
import { CustomerStampProgress } from "../../../stamp_campaigns/domain/CustomerStampProgress";
import { StampCampaignRepository } from "../../../stamp_campaigns/domain/StampCampaignRepository";
import { TenantNotFound } from "../../../../tenants/tenants/domain/TenantNotFound";
import { TenantAccessSuspended } from "../../../../tenants/tenants/domain/TenantAccessSuspended";
import { TenantRepository } from "../../../../tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../../../../tenants/tenants/domain/TenantStatus";
import { Customer } from "../../domain/Customer";
import { CustomerNotFound } from "../../domain/CustomerNotFound";
import { CustomerNotRegisteredInTenant } from "../../domain/CustomerNotRegisteredInTenant";
import { CustomerRepository } from "../../domain/CustomerRepository";

/** MVP: fixed points per staff scan until tenant-configurable rules exist. */
export const DEFAULT_POINTS_PER_VISIT = 1;

export type RecordCustomerVisitByQrInput = {
	tenantId: string;
	qrValue: string;
	createdByUserId: string;
	points?: number;
};

export type StampAddedSummary = {
	campaignId: string;
	campaignName: string;
	current: number;
	required: number;
	completed: boolean;
};

export type RecordCustomerVisitByQrResult = {
	customer: Customer;
	stampsAdded: StampAddedSummary[];
};

@Service()
export class RecordCustomerVisitByQr {
	constructor(
		private readonly tenantRepository: TenantRepository,
		private readonly customerRepository: CustomerRepository,
		private readonly userRepository: UserRepository,
		private readonly loyaltyTransactionRepository: LoyaltyTransactionRepository,
		private readonly stampCampaignRepository: StampCampaignRepository,
	) {}

	async execute(params: RecordCustomerVisitByQrInput): Promise<RecordCustomerVisitByQrResult> {
		await this.assertTenantAllowsLoyalty(params.tenantId);

		const points = params.points ?? DEFAULT_POINTS_PER_VISIT;
		const trimmedQr = params.qrValue.trim();
		const customer = await this.resolveCustomerByQr(params.tenantId, trimmedQr);

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

		const stampsAdded = await this.addStampsForActiveCampaigns({
			tenantId: params.tenantId,
			customerId: updated.id,
			createdByUserId: params.createdByUserId,
			qrValue: trimmedQr,
		});

		return { customer: updated, stampsAdded };
	}

	private async addStampsForActiveCampaigns(params: {
		tenantId: string;
		customerId: string;
		createdByUserId: string;
		qrValue: string;
	}): Promise<StampAddedSummary[]> {
		const campaigns = await this.stampCampaignRepository.listActiveByTenant(params.tenantId);
		const summaries: StampAddedSummary[] = [];

		for (const campaign of campaigns) {
			const existing = await this.stampCampaignRepository.searchProgress(
				params.tenantId,
				params.customerId,
				campaign.id,
			);
			const progress =
				existing ??
				CustomerStampProgress.start({
					tenantId: params.tenantId,
					customerId: params.customerId,
					campaignId: campaign.id,
				});

			const { progress: nextProgress, added } = progress.addStamp(campaign.requiredStamps);

			if (!added) {
				continue;
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
						source: "staff_scan",
						qrValue: params.qrValue,
					},
				}),
			);

			summaries.push({
				campaignId: campaign.id,
				campaignName: campaign.name,
				current: nextProgress.currentStamps,
				required: campaign.requiredStamps,
				completed: nextProgress.completed,
			});
		}

		return summaries;
	}

	/**
	 * 1) Legacy: customers.qr_value in tenant.
	 * 2) Platform app: users.qr_value → customers(user_id, tenant_id). No auto-join on scan.
	 */
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
			throw new CustomerNotRegisteredInTenant(tenantId);
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
