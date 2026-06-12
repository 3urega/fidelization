import type { CSSProperties } from "react";

/** Default stamp card background (variant `coffee-photo`). */
export const LOYALTY_CARD_BACKGROUND_IMAGE_URL = "/fondo_tarjetas.png";

export type LoyaltyCardBackgroundVariant =
	| "coffee-photo"
	| "coffee-sketch"
	| "coffee-pattern"
	| "coffee-minimal";

export type LoyaltyCardBackgroundConfig = {
	id: LoyaltyCardBackgroundVariant;
	label: string;
	imageUrl: string;
};

/** One full image per variant (`public/fondo_tarjetas*.png`). */
export const LOYALTY_CARD_BACKGROUNDS: LoyaltyCardBackgroundConfig[] = [
	{
		id: "coffee-photo",
		label: "Café con corazón",
		imageUrl: "/fondo_tarjetas.png",
	},
	{
		id: "coffee-sketch",
		label: "Tarta y postre",
		imageUrl: "/fondo_tarjetas2.png",
	},
	{
		id: "coffee-pattern",
		label: "Matcha",
		imageUrl: "/fondo_tarjetas3.png",
	},
	{
		id: "coffee-minimal",
		label: "Patrón fidelización",
		imageUrl: "/fondo_tarjetas4.png",
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
		backgroundImage: `url(${config.imageUrl})`,
		backgroundSize: "cover",
		backgroundPosition: "center",
		backgroundRepeat: "no-repeat",
	};
}
