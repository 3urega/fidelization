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

export function getStampSpriteUrl(
	template: LoyaltyVisualTemplate,
	state: LoyaltyStampSpriteState,
): string {
	return `/assets/loyalty/${template}/${template}-${state}.svg`;
}

export function resolveLoyaltyVisualTemplate(
	template: LoyaltyVisualTemplate | null | undefined,
): LoyaltyVisualTemplateConfig {
	const id = parseLoyaltyVisualTemplate(template ?? undefined);

	return LOYALTY_VISUAL_TEMPLATES.find((row) => row.id === id) ?? LOYALTY_VISUAL_TEMPLATES[4];
}
