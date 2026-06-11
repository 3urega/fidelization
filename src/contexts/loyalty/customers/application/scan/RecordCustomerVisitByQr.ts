import { Service } from "diod";

import { UserRepository } from "../../../../identity/users/domain/UserRepository";
import { LoyaltyTransaction } from "../../../loyalty_transactions/domain/LoyaltyTransaction";
import { LoyaltyTransactionRepository } from "../../../loyalty_transactions/domain/LoyaltyTransactionRepository";
import { GENERIC_STAMP_VISIT_LABEL } from "../../../stamp_types/domain/StampType";
import { ResolveStampScanOptions } from "../../../stamp_types/application/scan/ResolveStampScanOptions";
import { StampTypeNotFound } from "../../../stamp_types/domain/StampTypeNotFound";
import { StampTypeRepository } from "../../../stamp_types/domain/StampTypeRepository";
import { CustomerStampProgress } from "../../../stamp_campaigns/domain/CustomerStampProgress";
import { StampCampaignRepository } from "../../../stamp_campaigns/domain/StampCampaignRepository";
import { TenantNotFound } from "../../../../tenants/tenants/domain/TenantNotFound";
import { TenantAccessSuspended } from "../../../../tenants/tenants/domain/TenantAccessSuspended";
import { TenantRepository } from "../../../../tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../../../../tenants/tenants/domain/TenantStatus";
import { TenantRole } from "../../../../tenants/memberships/domain/TenantRole";
import { Customer } from "../../domain/Customer";
import { CustomerNotFound } from "../../domain/CustomerNotFound";
import { CustomerRepository } from "../../domain/CustomerRepository";
import { InvalidStampScan } from "../../domain/InvalidStampScan";

/** MVP: fixed points per staff scan until tenant-configurable rules exist. */
export const DEFAULT_POINTS_PER_VISIT = 1;

export type RecordCustomerVisitByQrInput = {
	tenantId: string;
	qrValue: string;
	createdByUserId: string;
	points?: number;
	staffRole: TenantRole;
	stampTypeId?: string | null;
};

export type StampAddedSummary = {
	campaignId: string;
	campaignName: string;
	current: number;
	required: number;
	completed: boolean;
	stampTypeId: string | null;
	stampTypeLabel: string;
};

export type RecordCustomerVisitByQrResult = {
	customer: Customer;
	stampsAdded: StampAddedSummary[];
	selectedStampTypeId: string | null;
	selectedStampTypeLabel: string | null;
};

@Service()
export class RecordCustomerVisitByQr {
	constructor(
		private readonly tenantRepository: TenantRepository,
		private readonly customerRepository: CustomerRepository,
		private readonly userRepository: UserRepository,
		private readonly loyaltyTransactionRepository: LoyaltyTransactionRepository,
		private readonly stampCampaignRepository: StampCampaignRepository,
		private readonly stampTypeRepository: StampTypeRepository,
		private readonly resolveStampScanOptions: ResolveStampScanOptions,
	) {}

	async execute(params: RecordCustomerVisitByQrInput): Promise<RecordCustomerVisitByQrResult> {
		await this.assertTenantAllowsLoyalty(params.tenantId);

		const scanOptions = await this.resolveStampScanOptions.execute({
			tenantId: params.tenantId,
			role: params.staffRole,
		});

		const { stampTypeId, stampTypeLabel } = await this.resolveStampTypeSelection({
			tenantId: params.tenantId,
			selectionRequired: scanOptions.selectionRequired,
			stampTypeId: params.stampTypeId,
		});

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
			stampTypeId,
			stampTypeLabel,
		});

		return {
			customer: updated,
			stampsAdded,
			selectedStampTypeId: stampTypeId,
			selectedStampTypeLabel: stampTypeLabel,
		};
	}

	private async resolveStampTypeSelection(params: {
		tenantId: string;
		selectionRequired: boolean;
		stampTypeId?: string | null;
	}): Promise<{ stampTypeId: string | null; stampTypeLabel: string | null }> {
		if (!params.selectionRequired) {
			return {
				stampTypeId: params.stampTypeId ?? null,
				stampTypeLabel:
					params.stampTypeId === undefined || params.stampTypeId === null
						? GENERIC_STAMP_VISIT_LABEL
						: await this.loadStampTypeLabel(params.tenantId, params.stampTypeId),
			};
		}

		if (params.stampTypeId === undefined) {
			throw new InvalidStampScan("stampTypeId is required when stamp types are configured");
		}

		if (params.stampTypeId === null) {
			return { stampTypeId: null, stampTypeLabel: GENERIC_STAMP_VISIT_LABEL };
		}

		const stampType = await this.stampTypeRepository.searchById(params.tenantId, params.stampTypeId);

		if (!stampType || !stampType.isActive) {
			throw new StampTypeNotFound(params.stampTypeId);
		}

		return { stampTypeId: stampType.id, stampTypeLabel: stampType.label };
	}

	private async loadStampTypeLabel(tenantId: string, stampTypeId: string): Promise<string> {
		const stampType = await this.stampTypeRepository.searchById(tenantId, stampTypeId);

		if (!stampType || !stampType.isActive) {
			throw new StampTypeNotFound(stampTypeId);
		}

		return stampType.label;
	}

	private async addStampsForActiveCampaigns(params: {
		tenantId: string;
		customerId: string;
		createdByUserId: string;
		qrValue: string;
		stampTypeId: string | null;
		stampTypeLabel: string | null;
	}): Promise<StampAddedSummary[]> {
		const campaigns = await this.stampCampaignRepository.listActiveByTenant(params.tenantId);
		const applicable = campaigns.filter((campaign) => campaign.stampTypeId === params.stampTypeId);
		const summaries: StampAddedSummary[] = [];

		for (const campaign of applicable) {
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
						stampTypeId: params.stampTypeId,
						stampTypeLabel: params.stampTypeLabel,
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
				stampTypeId: campaign.stampTypeId,
				stampTypeLabel: params.stampTypeLabel ?? GENERIC_STAMP_VISIT_LABEL,
			});
		}

		return summaries;
	}

	/**
	 * 1) Legacy: customers.qr_value in tenant.
	 * 2) Platform app: users.qr_value → customers(user_id, tenant_id); auto-join on first scan.
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
		if (linked) {
			return linked;
		}

		const customer = Customer.joinForPlatformUser({
			tenantId,
			userId: user.id.value,
			name: user.name.value,
			email: user.email.value,
		});
		await this.customerRepository.save(customer);

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
