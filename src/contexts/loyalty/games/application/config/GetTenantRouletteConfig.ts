import { Service } from "diod";

import type { RouletteConfig } from "../../domain/RouletteConfig";
import { RULETA_GAME_SLUG } from "../../domain/TenantGameActivation";
import { TenantGameActivationRepository } from "../../domain/TenantGameActivationRepository";

export type GetTenantRouletteConfigParams = {
	tenantId: string;
	gameSlug?: string;
};

export type GetTenantRouletteConfigResult = {
	isEnabled: boolean;
	config: RouletteConfig | null;
};

@Service()
export class GetTenantRouletteConfig {
	constructor(private readonly activationRepository: TenantGameActivationRepository) {}

	async execute(params: GetTenantRouletteConfigParams): Promise<GetTenantRouletteConfigResult> {
		const gameSlug = params.gameSlug ?? RULETA_GAME_SLUG;
		const activation = await this.activationRepository.searchByTenantAndSlug(
			params.tenantId,
			gameSlug,
		);

		if (!activation) {
			return { isEnabled: false, config: null };
		}

		return {
			isEnabled: activation.isEnabled,
			config: activation.config,
		};
	}
}
