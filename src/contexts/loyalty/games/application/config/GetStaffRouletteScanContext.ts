import { Service } from "diod";

import { AssertTenantPlanFeature } from "../../../../billing/subscriptions/application/guard/AssertTenantPlanFeature";
import { isOwnerVisiblePlatformGameStatus } from "../../../../platform/domain/PlatformGameStatus";
import { PlatformGameRepository } from "../../../../platform/domain/PlatformGameRepository";
import { GetTenantRouletteConfig } from "./GetTenantRouletteConfig";
import { usesLegacyStaffScanAuthorization } from "../../domain/RouletteConfig";
import { RULETA_GAME_SLUG } from "../../domain/TenantGameActivation";

export type GetStaffRouletteScanContextParams = {
	tenantId: string;
};

export type GetStaffRouletteScanContextResult = {
	unlockEnabled: boolean;
};

@Service()
export class GetStaffRouletteScanContext {
	constructor(
		private readonly assertTenantPlanFeature: AssertTenantPlanFeature,
		private readonly platformGameRepository: PlatformGameRepository,
		private readonly getTenantRouletteConfig: GetTenantRouletteConfig,
	) {}

	async execute(params: GetStaffRouletteScanContextParams): Promise<GetStaffRouletteScanContextResult> {
		try {
			await this.assertTenantPlanFeature.execute({
				tenantId: params.tenantId,
				feature: "gamification",
			});
		} catch {
			return { unlockEnabled: false };
		}

		const platformGame = await this.platformGameRepository.searchBySlug(RULETA_GAME_SLUG);

		if (!platformGame || !isOwnerVisiblePlatformGameStatus(platformGame.toPrimitives().status)) {
			return { unlockEnabled: false };
		}

		const activation = await this.getTenantRouletteConfig.execute({
			tenantId: params.tenantId,
		});

		if (!activation.isEnabled || !activation.config) {
			return { unlockEnabled: false };
		}

		return {
			unlockEnabled: usesLegacyStaffScanAuthorization(activation.config),
		};
	}
}
