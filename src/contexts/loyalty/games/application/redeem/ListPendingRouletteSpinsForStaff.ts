import { Service } from "diod";

import { AssertTenantPlanFeature } from "../../../../billing/subscriptions/application/guard/AssertTenantPlanFeature";
import { ResolveCustomerByQrForStaffScan } from "../../../customers/application/scan/ResolveCustomerByQrForStaffScan";
import { TenantRole } from "../../../../tenants/memberships/domain/TenantRole";
import { RouletteSpinRepository } from "../../domain/RouletteSpinRepository";
import { RouletteStaffForbidden } from "../../domain/RouletteStaffForbidden";

export type ListPendingRouletteSpinsForStaffParams = {
	tenantId: string;
	qrValue: string;
	staffRole: TenantRole;
};

export type PendingRouletteSpinForStaff = {
	spinId: string;
	segmentLabel: string;
	prizeDescription: string | null;
	createdAt: string;
};

export type ListPendingRouletteSpinsForStaffResult = {
	customerId: string;
	customerName: string;
	pendingSpins: PendingRouletteSpinForStaff[];
};

@Service()
export class ListPendingRouletteSpinsForStaff {
	constructor(
		private readonly assertTenantPlanFeature: AssertTenantPlanFeature,
		private readonly resolveCustomerByQr: ResolveCustomerByQrForStaffScan,
		private readonly spinRepository: RouletteSpinRepository,
	) {}

	async execute(
		params: ListPendingRouletteSpinsForStaffParams,
	): Promise<ListPendingRouletteSpinsForStaffResult> {
		if (params.staffRole !== TenantRole.Owner && params.staffRole !== TenantRole.Employee) {
			throw new RouletteStaffForbidden(params.staffRole);
		}

		await this.assertTenantPlanFeature.execute({
			tenantId: params.tenantId,
			feature: "gamification",
		});

		const customer = await this.resolveCustomerByQr.execute({
			tenantId: params.tenantId,
			qrValue: params.qrValue.trim(),
		});
		const customerPrimitives = customer.toPrimitives();
		const spins = await this.spinRepository.listPendingRedeemByCustomer(
			params.tenantId,
			customerPrimitives.id,
		);

		return {
			customerId: customerPrimitives.id,
			customerName: customerPrimitives.name,
			pendingSpins: spins.map((spin) => {
				const primitives = spin.toPrimitives();
				const prizeDescription =
					typeof primitives.prizePayload.description === "string"
						? primitives.prizePayload.description
						: null;

				return {
					spinId: primitives.id,
					segmentLabel: spin.segmentLabel(),
					prizeDescription,
					createdAt: primitives.createdAt,
				};
			}),
		};
	}
}
