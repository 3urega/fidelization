import { randomUUID } from "crypto";

import type { RouletteConfig, RouletteConfigPrimitives } from "./RouletteConfig";
import { parseRouletteConfig } from "./RouletteConfig";

export const RULETA_GAME_SLUG = "ruleta";

export type TenantGameActivationPrimitives = {
	id: string;
	tenantId: string;
	gameSlug: string;
	isEnabled: boolean;
	config: RouletteConfigPrimitives;
};

export type TenantGameActivationCreateParams = {
	tenantId: string;
	gameSlug: string;
	isEnabled: boolean;
	config: RouletteConfig;
};

export class TenantGameActivation {
	private constructor(
		public readonly id: string,
		public readonly tenantId: string,
		public readonly gameSlug: string,
		public readonly isEnabled: boolean,
		public readonly config: RouletteConfig,
	) {}

	static create(params: TenantGameActivationCreateParams): TenantGameActivation {
		return new TenantGameActivation(
			randomUUID(),
			params.tenantId,
			params.gameSlug,
			params.isEnabled,
			params.config,
		);
	}

	static fromPrimitives(primitives: TenantGameActivationPrimitives): TenantGameActivation {
		return new TenantGameActivation(
			primitives.id,
			primitives.tenantId,
			primitives.gameSlug,
			primitives.isEnabled,
			parseRouletteConfig(primitives.config),
		);
	}

	toPrimitives(): TenantGameActivationPrimitives {
		return {
			id: this.id,
			tenantId: this.tenantId,
			gameSlug: this.gameSlug,
			isEnabled: this.isEnabled,
			config: this.config.toPrimitives(),
		};
	}

	withConfig(config: RouletteConfig): TenantGameActivation {
		return new TenantGameActivation(this.id, this.tenantId, this.gameSlug, this.isEnabled, config);
	}

	withEnabled(isEnabled: boolean): TenantGameActivation {
		return new TenantGameActivation(this.id, this.tenantId, this.gameSlug, isEnabled, this.config);
	}
}
