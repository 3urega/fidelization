export type SubscriptionPlanFeatures = {
	stamps: boolean;
	points: boolean;
	promotions: boolean;
	coupons: boolean;
	push: boolean;
	gamification: boolean;
	referrals: boolean;
	analytics: boolean;
};

export type SubscriptionPlanLimits = {
	employees?: number;
};

export const BASIC_PLAN_FEATURES: SubscriptionPlanFeatures = {
	stamps: true,
	points: true,
	promotions: false,
	coupons: false,
	push: false,
	gamification: false,
	referrals: false,
	analytics: false,
};

export const PRO_PLAN_FEATURES: SubscriptionPlanFeatures = {
	stamps: true,
	points: true,
	promotions: true,
	coupons: true,
	push: true,
	gamification: false,
	referrals: false,
	analytics: true,
};

export const PREMIUM_PLAN_FEATURES: SubscriptionPlanFeatures = {
	stamps: true,
	points: true,
	promotions: true,
	coupons: true,
	push: true,
	gamification: true,
	referrals: true,
	analytics: true,
};

export function parseSubscriptionPlanFeatures(value: unknown): SubscriptionPlanFeatures {
	if (!value || typeof value !== "object") {
		return { ...BASIC_PLAN_FEATURES };
	}

	const record = value as Record<string, unknown>;

	return {
		stamps: record.stamps === true,
		points: record.points === true,
		promotions: record.promotions === true,
		coupons: record.coupons === true,
		push: record.push === true,
		gamification: record.gamification === true,
		referrals: record.referrals === true,
		analytics: record.analytics === true,
	};
}

export function parseSubscriptionPlanLimits(value: unknown): SubscriptionPlanLimits | null {
	if (!value || typeof value !== "object") {
		return null;
	}

	const record = value as Record<string, unknown>;
	const employees =
		typeof record.employees === "number" && Number.isInteger(record.employees)
			? record.employees
			: undefined;

	if (employees === undefined) {
		return null;
	}

	return { employees };
}
