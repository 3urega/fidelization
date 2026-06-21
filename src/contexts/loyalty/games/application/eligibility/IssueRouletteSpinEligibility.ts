import { Service } from "diod";

import { AssertTenantPlanFeature } from "../../../../billing/subscriptions/application/guard/AssertTenantPlanFeature";
import { isOwnerVisiblePlatformGameStatus } from "../../../../platform/domain/PlatformGameStatus";
import { PlatformGameRepository } from "../../../../platform/domain/PlatformGameRepository";
import { GetTenantRouletteConfig } from "../config/GetTenantRouletteConfig";
import { RouletteSpinEligibility } from "../../domain/RouletteSpinEligibility";
import { RouletteSpinEligibilityRepository } from "../../domain/RouletteSpinEligibilityRepository";
import { RULETA_GAME_SLUG } from "../../domain/TenantGameActivation";

export type IssueRouletteSpinEligibilityParams = {
	tenantId: string;
	customerId: string;
	triggerRef?: string | null;
};

export type IssueRouletteSpinEligibilityResult = {
	eligibilityId: string;
	expiresAt: string;
};

@Service()
export class IssueRouletteSpinEligibility {
	constructor(
		private readonly assertTenantPlanFeature: AssertTenantPlanFeature,
		private readonly platformGameRepository: PlatformGameRepository,
		private readonly getTenantRouletteConfig: GetTenantRouletteConfig,
		private readonly eligibilityRepository: RouletteSpinEligibilityRepository,
	) {}

	async execute(
		params: IssueRouletteSpinEligibilityParams,
	): Promise<IssueRouletteSpinEligibilityResult | null> {
		try {
			await this.assertTenantPlanFeature.execute({
				tenantId: params.tenantId,
				feature: "gamification",
			});
		} catch {
			return null;
		}

		const platformGame = await this.platformGameRepository.searchBySlug(RULETA_GAME_SLUG);

		if (!platformGame || !isOwnerVisiblePlatformGameStatus(platformGame.toPrimitives().status)) {
			return null;
		}

		const activation = await this.getTenantRouletteConfig.execute({
			tenantId: params.tenantId,
		});

		if (!activation.isEnabled || !activation.config) {
			return null;
		}

		const rules = activation.config.toPrimitives().rules;

		if (rules.trigger !== "after_staff_scan") {
			return null;
		}

		const expiresAt = new Date(Date.now() + rules.eligibilityTtlHours * 60 * 60 * 1000);
		const existing = await this.eligibilityRepository.findUnconsumedByCustomer(
			params.tenantId,
			params.customerId,
		);

		const eligibility = existing
			? existing.withRenewedExpiry(expiresAt, params.triggerRef)
			: RouletteSpinEligibility.create({
					tenantId: params.tenantId,
					customerId: params.customerId,
					expiresAt,
					triggerRef: params.triggerRef,
				});

		await this.eligibilityRepository.save(eligibility);

		const primitives = eligibility.toPrimitives();

		return {
			eligibilityId: primitives.id,
			expiresAt: primitives.expiresAt,
		};
	}
}
