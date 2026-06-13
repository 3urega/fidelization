export const PLATFORM_GAME_STATUSES = ["draft", "active", "beta"] as const;

export type PlatformGameStatus = (typeof PLATFORM_GAME_STATUSES)[number];

export function parsePlatformGameStatus(value: unknown): PlatformGameStatus {
	const status = String(value ?? "").trim();

	if (!PLATFORM_GAME_STATUSES.includes(status as PlatformGameStatus)) {
		throw new Error(`Invalid platform game status: ${String(value)}`);
	}

	return status as PlatformGameStatus;
}

export function isOwnerVisiblePlatformGameStatus(status: PlatformGameStatus): boolean {
	return status === "active" || status === "beta";
}
