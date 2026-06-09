import type { SubscriptionPlanFeatures } from "./SubscriptionPlanFeatures";

export type TenantPlanFeature = keyof SubscriptionPlanFeatures;

const FEATURE_KEYS: TenantPlanFeature[] = [
	"stamps",
	"points",
	"promotions",
	"coupons",
	"push",
	"gamification",
	"referrals",
	"analytics",
];

export function enabledFeatures(features: SubscriptionPlanFeatures): TenantPlanFeature[] {
	return FEATURE_KEYS.filter((feature) => features[feature]);
}

export function isPlanFeatureEnabled(
	features: SubscriptionPlanFeatures,
	feature: TenantPlanFeature,
): boolean {
	return features[feature] === true;
}
