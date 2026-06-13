import { InvalidPromotion } from "./InvalidPromotion";
import { PromotionType } from "./Promotion";

const MAX_TITLE_LENGTH = 120;
const PROMOTION_TYPES: PromotionType[] = ["discount", "bundle", "seasonal"];

export type PromotionCreateInput = {
	title: string;
	description: string;
	type: PromotionType;
	startDate: Date | null;
	endDate: Date | null;
	maxUsesPerUser: number | null;
};

function parseOptionalMaxUsesPerUser(value: unknown): number | null {
	if (value === undefined || value === null || value === "") {
		return null;
	}

	const parsed = typeof value === "number" ? value : Number(value);

	if (!Number.isInteger(parsed) || parsed < 1) {
		throw new InvalidPromotion("maxUsesPerUser must be a positive integer");
	}

	return parsed;
}

function parseOptionalDate(value: string | undefined, field: string): Date | null {
	if (value === undefined || value === null || value.trim() === "") {
		return null;
	}

	const parsed = new Date(value);

	if (Number.isNaN(parsed.getTime())) {
		throw new InvalidPromotion(`${field} must be a valid ISO date`);
	}

	return parsed;
}

export function parsePromotionCreate(input: {
	title?: string;
	description?: string;
	type?: string;
	startDate?: string;
	endDate?: string;
	maxUsesPerUser?: unknown;
}): PromotionCreateInput {
	const title = input.title?.trim() ?? "";

	if (!title) {
		throw new InvalidPromotion("Promotion title is required");
	}

	if (title.length > MAX_TITLE_LENGTH) {
		throw new InvalidPromotion(`Promotion title must be at most ${MAX_TITLE_LENGTH} characters`);
	}

	const type = (input.type?.trim() || "discount") as PromotionType;

	if (!PROMOTION_TYPES.includes(type)) {
		throw new InvalidPromotion("type must be discount, bundle, or seasonal");
	}

	const startDate = parseOptionalDate(input.startDate, "startDate");
	const endDate = parseOptionalDate(input.endDate, "endDate");

	if (startDate && endDate && endDate < startDate) {
		throw new InvalidPromotion("endDate must be on or after startDate");
	}

	return {
		title,
		description: input.description?.trim() ?? "",
		type,
		startDate,
		endDate,
		maxUsesPerUser: parseOptionalMaxUsesPerUser(input.maxUsesPerUser),
	};
}
