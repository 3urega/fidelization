import { Service } from "diod";

import { AssertTenantPlanFeature } from "../../../../billing/subscriptions/application/guard/AssertTenantPlanFeature";
import { createDefaultRouletteConfigV2, type RouletteConfig } from "../../domain/RouletteConfig";
import {
	RULETA_GAME_SLUG,
	TenantGameActivation,
} from "../../domain/TenantGameActivation";
import { TenantGameActivationRepository } from "../../domain/TenantGameActivationRepository";

export type EnableTenantGameParams = {
	tenantId: string;
	isEnabled: boolean;
	gameSlug?: string;
};

export type EnableTenantGameResult = {
	isEnabled: boolean;
	config: RouletteConfig;
};

@Service()
export class EnableTenantGame {
	constructor(
		private readonly activationRepository: TenantGameActivationRepository,
		private readonly assertTenantPlanFeature: AssertTenantPlanFeature,
	) {}

	async execute(params: EnableTenantGameParams): Promise<EnableTenantGameResult> {
		await this.assertTenantPlanFeature.execute({
			tenantId: params.tenantId,
			feature: "gamification",
		});

		const gameSlug = params.gameSlug ?? RULETA_GAME_SLUG;
		const existing = await this.activationRepository.searchByTenantAndSlug(
			params.tenantId,
			gameSlug,
		);

		if (!existing) {
			if (!params.isEnabled) {
				return { isEnabled: false, config: createDefaultRouletteConfigV2() };
			}

			const activation = TenantGameActivation.create({
				tenantId: params.tenantId,
				gameSlug,
				isEnabled: true,
				config: createDefaultRouletteConfigV2(),
			});

			await this.activationRepository.save(activation);

			return { isEnabled: true, config: activation.config };
		}

		const updated = existing.withEnabled(params.isEnabled);
		await this.activationRepository.save(updated);

		return { isEnabled: updated.isEnabled, config: updated.config };
	}
}
