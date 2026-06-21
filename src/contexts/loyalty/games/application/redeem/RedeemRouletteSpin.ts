import { Service } from "diod";

import { AssertTenantPlanFeature } from "../../../../billing/subscriptions/application/guard/AssertTenantPlanFeature";
import { TenantRole } from "../../../../tenants/memberships/domain/TenantRole";
import { RouletteSpinNotFound } from "../../domain/RouletteSpinNotFound";
import { RouletteSpinRepository } from "../../domain/RouletteSpinRepository";
import { RouletteStaffForbidden } from "../../domain/RouletteStaffForbidden";

export type RedeemRouletteSpinParams = {
	tenantId: string;
	spinId: string;
	staffRole: TenantRole;
	staffUserId: string;
};

export type RedeemRouletteSpinResult = {
	spinId: string;
	status: "applied";
	redeemedAt: string;
	segmentLabel: string;
	prizeDescription: string | null;
	customerId: string;
};

@Service()
export class RedeemRouletteSpin {
	constructor(
		private readonly assertTenantPlanFeature: AssertTenantPlanFeature,
		private readonly spinRepository: RouletteSpinRepository,
	) {}

	async execute(params: RedeemRouletteSpinParams): Promise<RedeemRouletteSpinResult> {
		if (params.staffRole !== TenantRole.Owner && params.staffRole !== TenantRole.Employee) {
			throw new RouletteStaffForbidden(params.staffRole);
		}

		await this.assertTenantPlanFeature.execute({
			tenantId: params.tenantId,
			feature: "gamification",
		});

		const spin = await this.spinRepository.searchById(params.tenantId, params.spinId);

		if (!spin) {
			throw new RouletteSpinNotFound(params.spinId);
		}

		const redeemed = spin.redeem();
		await this.spinRepository.save(redeemed);

		const primitives = redeemed.toPrimitives();
		const prizeDescription =
			typeof primitives.prizePayload.description === "string"
				? primitives.prizePayload.description
				: null;

		return {
			spinId: primitives.id,
			status: "applied",
			redeemedAt: primitives.redeemedAt ?? new Date().toISOString(),
			segmentLabel: redeemed.segmentLabel(),
			prizeDescription,
			customerId: primitives.customerId,
		};
	}
}
