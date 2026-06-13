export type LoyaltyStampSpriteState = "empty" | "filled" | "reward";

export type LoyaltyVisualTemplate = "coffee" | "croissant" | "burger" | "pizza" | "generic";

export type LoyaltyVisualTemplateConfig = {
	id: LoyaltyVisualTemplate;
	label: string;
};

export const LOYALTY_VISUAL_TEMPLATES: LoyaltyVisualTemplateConfig[] = [
	{ id: "coffee", label: "Café" },
	{ id: "croissant", label: "Croissant" },
	{ id: "burger", label: "Hamburguesa" },
	{ id: "pizza", label: "Pizza" },
	{ id: "generic", label: "Genérico" },
];

const LOYALTY_VISUAL_TEMPLATE_IDS = new Set<LoyaltyVisualTemplate>(
	LOYALTY_VISUAL_TEMPLATES.map((row) => row.id),
);

export function parseLoyaltyVisualTemplate(value: string | null | undefined): LoyaltyVisualTemplate {
	if (value && LOYALTY_VISUAL_TEMPLATE_IDS.has(value as LoyaltyVisualTemplate)) {
		return value as LoyaltyVisualTemplate;
	}

	return "generic";
}

export type StampSpriteRenderMode = "svg-mask" | "raster";

export type StampSpriteAsset = {
	url: string;
	renderMode: StampSpriteRenderMode;
};

/** Shared reward sprite for every visual template. */
export const LOYALTY_REWARD_SPRITE_URL = "/assets/loyalty/coffee/price.png";

const COFFEE_STAMP_SPRITES: Record<Exclude<LoyaltyStampSpriteState, "reward">, string> = {
	empty: "/assets/loyalty/coffee/coffe-empty.png",
	filled: "/assets/loyalty/coffee/coffe-filled.png",
};

export function resolveStampSprite(
	template: LoyaltyVisualTemplate,
	state: LoyaltyStampSpriteState,
): StampSpriteAsset {
	if (state === "reward") {
		return { url: LOYALTY_REWARD_SPRITE_URL, renderMode: "raster" };
	}

	if (template === "coffee") {
		return { url: COFFEE_STAMP_SPRITES[state], renderMode: "raster" };
	}

	return {
		url: `/assets/loyalty/${template}/${template}-${state}.svg`,
		renderMode: "svg-mask",
	};
}

export function getStampSpriteUrl(
	template: LoyaltyVisualTemplate,
	state: LoyaltyStampSpriteState,
): string {
	return resolveStampSprite(template, state).url;
}

export function resolveLoyaltyVisualTemplate(
	template: LoyaltyVisualTemplate | null | undefined,
): LoyaltyVisualTemplateConfig {
	const id = parseLoyaltyVisualTemplate(template ?? undefined);

	return LOYALTY_VISUAL_TEMPLATES.find((row) => row.id === id) ?? LOYALTY_VISUAL_TEMPLATES[4];
}
