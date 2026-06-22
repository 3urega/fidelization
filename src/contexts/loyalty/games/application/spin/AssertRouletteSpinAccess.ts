import { Service } from "diod";

import { AssertTenantPlanFeature } from "../../../../billing/subscriptions/application/guard/AssertTenantPlanFeature";
import { isOwnerVisiblePlatformGameStatus } from "../../../../platform/domain/PlatformGameStatus";
import { PlatformGameRepository } from "../../../../platform/domain/PlatformGameRepository";
import { GetTenantRouletteConfig } from "../config/GetTenantRouletteConfig";
import { getRateLimitRules } from "../../domain/RouletteConfig";
import { RouletteGameDisabled } from "../../domain/RouletteGameDisabled";
import { RouletteGameNotAvailable } from "../../domain/RouletteGameNotAvailable";
import { RouletteSpinRateLimitExceeded } from "../../domain/RouletteSpinRateLimitExceeded";
import { RULETA_GAME_SLUG } from "../../domain/TenantGameActivation";
import { RouletteSpinRepository } from "../../domain/RouletteSpinRepository";

export type AssertRouletteSpinAccessParams = {
	tenantId: string;
	customerId: string;
};

export type RouletteSpinAccessContext = {
	isEnabled: true;
	maxSpinsPerDay: number;
	maxSpinsPerWeek: number;
};

@Service()
export class AssertRouletteSpinAccess {
	constructor(
		private readonly assertTenantPlanFeature: AssertTenantPlanFeature,
		private readonly platformGameRepository: PlatformGameRepository,
		private readonly getTenantRouletteConfig: GetTenantRouletteConfig,
		private readonly spinRepository: RouletteSpinRepository,
	) {}

	async execute(params: AssertRouletteSpinAccessParams): Promise<RouletteSpinAccessContext> {
		await this.assertTenantPlanFeature.execute({
			tenantId: params.tenantId,
			feature: "gamification",
		});

		const platformGame = await this.platformGameRepository.searchBySlug(RULETA_GAME_SLUG);

		if (!platformGame || !isOwnerVisiblePlatformGameStatus(platformGame.toPrimitives().status)) {
			throw new RouletteGameNotAvailable("Roulette is not available for this establishment");
		}

		const activation = await this.getTenantRouletteConfig.execute({
			tenantId: params.tenantId,
		});

		if (!activation.isEnabled || !activation.config) {
			throw new RouletteGameDisabled();
		}

		const { maxSpinsPerDay, maxSpinsPerWeek } = getRateLimitRules(activation.config);
		await this.assertUnderRateLimits(params.tenantId, params.customerId, maxSpinsPerDay, maxSpinsPerWeek);

		return { isEnabled: true, maxSpinsPerDay, maxSpinsPerWeek };
	}

	async assertUnderRateLimits(
		tenantId: string,
		customerId: string,
		maxSpinsPerDay: number,
		maxSpinsPerWeek: number,
	): Promise<void> {
		const daySince = new Date(Date.now() - 24 * 60 * 60 * 1000);
		const weekSince = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

		const spinsToday = await this.spinRepository.countByCustomerSince(
			tenantId,
			customerId,
			daySince,
		);

		if (spinsToday >= maxSpinsPerDay) {
			throw new RouletteSpinRateLimitExceeded("day", maxSpinsPerDay);
		}

		const spinsWeek = await this.spinRepository.countByCustomerSince(
			tenantId,
			customerId,
			weekSince,
		);

		if (spinsWeek >= maxSpinsPerWeek) {
			throw new RouletteSpinRateLimitExceeded("week", maxSpinsPerWeek);
		}
	}
}
