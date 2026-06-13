import type { PlatformGame } from "./PlatformGame";
import { isOwnerVisiblePlatformGameStatus } from "./PlatformGameStatus";

export type ListPlatformGamesParams = {
	ownerVisibleOnly?: boolean;
};

export abstract class PlatformGameRepository {
	abstract list(params: ListPlatformGamesParams): Promise<PlatformGame[]>;

	abstract searchById(id: string): Promise<PlatformGame | null>;

	abstract searchBySlug(slug: string): Promise<PlatformGame | null>;

	abstract save(game: PlatformGame): Promise<void>;

	abstract maxSortOrder(): Promise<number>;
}

export function filterOwnerVisibleGames(games: PlatformGame[]): PlatformGame[] {
	return games.filter((game) => isOwnerVisiblePlatformGameStatus(game.toPrimitives().status));
}
