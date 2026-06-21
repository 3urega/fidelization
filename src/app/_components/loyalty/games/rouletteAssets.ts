import type { RoulettePrizeType } from "../../../../contexts/loyalty/games/domain/RoulettePrizeType";

export const ROULETTE_ASSETS_BASE = "/assets/ruleta";

export type RouletteAssetPath = `${typeof ROULETTE_ASSETS_BASE}/${string}`;

export const ROULETTE_WHEEL_ASSETS = {
	pointer: `${ROULETTE_ASSETS_BASE}/wheel-pointer.svg`,
	centerButton: `${ROULETTE_ASSETS_BASE}/wheel-center-button.svg`,
	outerRing: `${ROULETTE_ASSETS_BASE}/wheel-outer-ring.svg`,
	backgroundPattern: `${ROULETTE_ASSETS_BASE}/wheel-background-pattern.png`,
	modalBackdrop: `${ROULETTE_ASSETS_BASE}/modal-backdrop.svg`,
	segmentTextureA: `${ROULETTE_ASSETS_BASE}/segment-texture-alt-a.svg`,
	segmentTextureB: `${ROULETTE_ASSETS_BASE}/segment-texture-alt-b.svg`,
	stateLocked: `${ROULETTE_ASSETS_BASE}/state-locked.svg`,
	stateWinBanner: `${ROULETTE_ASSETS_BASE}/state-win-banner.svg`,
} as const satisfies Record<string, RouletteAssetPath>;

export const ROULETTE_PRIZE_ICONS: Record<RoulettePrizeType, RouletteAssetPath> = {
	none: `${ROULETTE_ASSETS_BASE}/prize-icon-none.png`,
	points: `${ROULETTE_ASSETS_BASE}/prize-icon-points.svg`,
	stamp: `${ROULETTE_ASSETS_BASE}/prize-icon-stamp.svg`,
	promotion: `${ROULETTE_ASSETS_BASE}/prize-icon-promo.svg`,
	physical: `${ROULETTE_ASSETS_BASE}/prize-icon-gift.svg`,
};

/** All roulette asset URLs that must exist on disk for verify. */
export const ROULETTE_REQUIRED_ASSET_PATHS: RouletteAssetPath[] = [
	...Object.values(ROULETTE_WHEEL_ASSETS),
	...Object.values(ROULETTE_PRIZE_ICONS),
];

export function getRoulettePrizeIconUrl(prizeType: RoulettePrizeType | string): RouletteAssetPath {
	if (prizeType in ROULETTE_PRIZE_ICONS) {
		return ROULETTE_PRIZE_ICONS[prizeType as RoulettePrizeType];
	}

	return ROULETTE_PRIZE_ICONS.none;
}
