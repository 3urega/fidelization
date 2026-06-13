import type { PlatformGame } from "../../contexts/platform/domain/PlatformGame";
import type { PlatformGameStatus } from "../../contexts/platform/domain/PlatformGameStatus";
import type { TenantPlanFeature } from "../../contexts/billing/subscriptions/domain/TenantPlanFeature";

export type PlatformGameResponse = {
	id: string;
	slug: string;
	label: string;
	description: string;
	status: PlatformGameStatus;
	requiredFeature: TenantPlanFeature;
	sortOrder: number;
};

export function platformGameToJson(game: PlatformGame): PlatformGameResponse {
	const primitives = game.toPrimitives();

	return {
		id: primitives.id,
		slug: primitives.slug,
		label: primitives.label,
		description: primitives.description,
		status: primitives.status,
		requiredFeature: primitives.requiredFeature,
		sortOrder: primitives.sortOrder,
	};
}

export function platformGamesToJson(games: PlatformGame[]): { games: PlatformGameResponse[] } {
	return {
		games: games.map((game) => platformGameToJson(game)),
	};
}
