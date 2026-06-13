import { Promotion, PromotionType } from "./Promotion";

export type CustomerPromotionSummary = {
	id: string;
	tenantId: string;
	title: string;
	description: string;
	type: PromotionType;
	startDate: string | null;
	endDate: string | null;
	isActive: boolean;
	maxUsesPerUser: number | null;
	usedCount: number;
};

export function customerPromotionSummaryFromPromotion(
	promotion: Promotion,
	usedCount: number,
): CustomerPromotionSummary {
	const primitives = promotion.toPrimitives();

	return {
		id: primitives.id,
		tenantId: primitives.tenantId,
		title: primitives.title,
		description: primitives.description,
		type: primitives.type,
		startDate: primitives.startDate,
		endDate: primitives.endDate,
		isActive: primitives.isActive,
		maxUsesPerUser: primitives.maxUsesPerUser,
		usedCount,
	};
}
