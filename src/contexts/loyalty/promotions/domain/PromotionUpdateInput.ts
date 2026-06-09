import { InvalidPromotion } from "./InvalidPromotion";

export function parsePromotionDeactivate(input: { isActive?: boolean }): { isActive: false } {
	if (input.isActive !== false) {
		throw new InvalidPromotion("Only deactivation is supported (isActive: false)");
	}

	return { isActive: false };
}
