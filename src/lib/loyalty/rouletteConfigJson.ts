import type { RouletteConfig } from "../../contexts/loyalty/games/domain/RouletteConfig";
import type { RouletteConfigPrimitives } from "../../contexts/loyalty/games/domain/RouletteConfig";

export type RouletteConfigResponse = {
	isEnabled: boolean;
	config: RouletteConfigPrimitives | null;
};

export function rouletteConfigToJson(config: RouletteConfig): RouletteConfigPrimitives {
	return config.toPrimitives();
}

export function rouletteConfigResultToJson(result: {
	isEnabled: boolean;
	config: RouletteConfig | null;
}): RouletteConfigResponse {
	return {
		isEnabled: result.isEnabled,
		config: result.config ? rouletteConfigToJson(result.config) : null,
	};
}
