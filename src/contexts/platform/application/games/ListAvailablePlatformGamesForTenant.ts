import { Service } from "diod";

import { ResolveTenantEffectivePlanFeatures } from "../../../billing/subscriptions/application/resolve/ResolveTenantEffectivePlanFeatures";
import { isPlanFeatureEnabled } from "../../../billing/subscriptions/domain/TenantPlanFeature";
import type { PlatformGame } from "../../domain/PlatformGame";
import { ListPlatformGames } from "./ListPlatformGames";

export type ListAvailablePlatformGamesForTenantParams = {
	tenantId: string;
};

@Service()
export class ListAvailablePlatformGamesForTenant {
	constructor(
		private readonly listPlatformGames: ListPlatformGames,
		private readonly resolveTenantEffectivePlanFeatures: ResolveTenantEffectivePlanFeatures,
	) {}

	async execute(params: ListAvailablePlatformGamesForTenantParams): Promise<PlatformGame[]> {
		const resolved = await this.resolveTenantEffectivePlanFeatures.execute(params.tenantId);
		const games = await this.listPlatformGames.execute({ ownerVisibleOnly: true });

		return games.filter((game) =>
			isPlanFeatureEnabled(resolved.effectiveFeatures, game.toPrimitives().requiredFeature),
		);
	}
}
