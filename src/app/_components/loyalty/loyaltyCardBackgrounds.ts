import type { CSSProperties } from "react";

/** Sprite sheet `public/fondos.png` — 2×2 grid (1254×1254 px; each quadrant 627×627). */

export const LOYALTY_CARD_BACKGROUND_SPRITE_URL = "/fondos.png";

export type LoyaltyCardBackgroundVariant =
	| "coffee-photo"
	| "coffee-sketch"
	| "coffee-pattern"
	| "coffee-minimal";

export type LoyaltyCardBackgroundConfig = {
	id: LoyaltyCardBackgroundVariant;
	label: string;
	/** CSS background-position for one quadrant (`background-size: 200% 200%`). */
	backgroundPosition: string;
};

/**
 * Quadrants per sprite instructions in fondos.png:
 * - coffee-photo:   (0,0) → (25%,25%)   top-left
 * - coffee-sketch:  (25%,0) → (50%,25%)  top-right
 * - coffee-pattern: (0,25%) → (25%,50%)  bottom-left
 * - coffee-minimal: (25%,25%) → (50%,50%) bottom-right
 */
export const LOYALTY_CARD_BACKGROUNDS: LoyaltyCardBackgroundConfig[] = [
	{
		id: "coffee-photo",
		label: "Foto café",
		backgroundPosition: "0% 0%",
	},
	{
		id: "coffee-sketch",
		label: "Ilustración",
		backgroundPosition: "100% 0%",
	},
	{
		id: "coffee-pattern",
		label: "Patrón oscuro",
		backgroundPosition: "0% 100%",
	},
	{
		id: "coffee-minimal",
		label: "Línea minimal",
		backgroundPosition: "100% 100%",
	},
];

export function resolveLoyaltyCardBackground(
	variant: LoyaltyCardBackgroundVariant | null | undefined,
): LoyaltyCardBackgroundConfig {
	const fallback = LOYALTY_CARD_BACKGROUNDS[0];
	if (!variant) {
		return fallback;
	}

	return LOYALTY_CARD_BACKGROUNDS.find((row) => row.id === variant) ?? fallback;
}

export function loyaltyCardBackgroundStyle(
	variant: LoyaltyCardBackgroundVariant | null | undefined,
): CSSProperties {
	const config = resolveLoyaltyCardBackground(variant);

	return {
		backgroundImage: `url(${LOYALTY_CARD_BACKGROUND_SPRITE_URL})`,
		backgroundSize: "200% 200%",
		backgroundPosition: config.backgroundPosition,
		backgroundRepeat: "no-repeat",
	};
}
