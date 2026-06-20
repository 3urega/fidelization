import { Service } from "diod";

import { AssertTenantPlanFeature } from "../../../../billing/subscriptions/application/guard/AssertTenantPlanFeature";
import { parseRouletteConfig, type RouletteConfig } from "../../domain/RouletteConfig";
import {
	RULETA_GAME_SLUG,
	TenantGameActivation,
} from "../../domain/TenantGameActivation";
import { TenantGameActivationRepository } from "../../domain/TenantGameActivationRepository";

export type UpsertTenantRouletteConfigParams = {
	tenantId: string;
	config: unknown;
	gameSlug?: string;
};

export type UpsertTenantRouletteConfigResult = {
	isEnabled: boolean;
	config: RouletteConfig;
};

@Service()
export class UpsertTenantRouletteConfig {
	constructor(
		private readonly activationRepository: TenantGameActivationRepository,
		private readonly assertTenantPlanFeature: AssertTenantPlanFeature,
	) {}

	async execute(params: UpsertTenantRouletteConfigParams): Promise<UpsertTenantRouletteConfigResult> {
		await this.assertTenantPlanFeature.execute({
			tenantId: params.tenantId,
			feature: "gamification",
		});

		const gameSlug = params.gameSlug ?? RULETA_GAME_SLUG;
		const config = parseRouletteConfig(params.config);
		const existing = await this.activationRepository.searchByTenantAndSlug(
			params.tenantId,
			gameSlug,
		);

		const activation = existing
			? existing.withConfig(config)
			: TenantGameActivation.create({
					tenantId: params.tenantId,
					gameSlug,
					isEnabled: false,
					config,
				});

		await this.activationRepository.save(activation);

		return {
			isEnabled: activation.isEnabled,
			config: activation.config,
		};
	}
}
