import { Service } from "diod";

import { AuthorizeRouletteSpin } from "../../../games/application/participation/AuthorizeRouletteSpin";
import { TenantRole } from "../../../../tenants/memberships/domain/TenantRole";
import { TenantAccessSuspended } from "../../../../tenants/tenants/domain/TenantAccessSuspended";
import { TenantNotFound } from "../../../../tenants/tenants/domain/TenantNotFound";
import { TenantRepository } from "../../../../tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../../../../tenants/tenants/domain/TenantStatus";
import { Customer } from "../../domain/Customer";
import { InvalidStampScan } from "../../domain/InvalidStampScan";
import { StaffScanForbidden } from "../../domain/StaffScanForbidden";
import type { StaffScanOutcome } from "../../domain/StaffScanOutcome";
import { mapRouletteAuthorizeErrorToDeniedOutcome } from "../../domain/StaffScanOutcome";
import { ResolveCustomerByQrForStaffScan } from "./ResolveCustomerByQrForStaffScan";

export type RecordStaffRouletteAuthorizeByQrParams = {
	tenantId: string;
	qrValue: string;
	purchaseAmountEuros: number;
	createdByUserId: string;
	staffRole: TenantRole;
};

export type RecordStaffRouletteAuthorizeByQrResult = {
	customer: Customer;
	outcomes: StaffScanOutcome[];
};

@Service()
export class RecordStaffRouletteAuthorizeByQr {
	constructor(
		private readonly tenantRepository: TenantRepository,
		private readonly resolveCustomerByQr: ResolveCustomerByQrForStaffScan,
		private readonly authorizeRouletteSpin: AuthorizeRouletteSpin,
	) {}

	async execute(
		params: RecordStaffRouletteAuthorizeByQrParams,
	): Promise<RecordStaffRouletteAuthorizeByQrResult> {
		if (params.staffRole !== TenantRole.Owner && params.staffRole !== TenantRole.Employee) {
			throw new StaffScanForbidden(params.staffRole);
		}

		if (!Number.isFinite(params.purchaseAmountEuros) || params.purchaseAmountEuros < 0) {
			throw new InvalidStampScan("purchaseAmountEuros must be a non-negative number");
		}

		await this.assertTenantAllowsLoyalty(params.tenantId);

		const trimmedQr = params.qrValue.trim();
		const customer = await this.resolveCustomerByQr.execute({
			tenantId: params.tenantId,
			qrValue: trimmedQr,
		});

		try {
			const authorized = await this.authorizeRouletteSpin.execute({
				tenantId: params.tenantId,
				customerId: customer.id,
				purchaseAmountEuros: params.purchaseAmountEuros,
				triggerRef: `staff-scan:${params.createdByUserId}`,
			});

			return {
				customer,
				outcomes: [
					{
						kind: "roulette_auth_granted",
						expiresAt: authorized.expiresAt,
						purchaseAmountEuros: params.purchaseAmountEuros,
					},
				],
			};
		} catch (error) {
			return {
				customer,
				outcomes: [mapRouletteAuthorizeErrorToDeniedOutcome(error)],
			};
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
