import { env } from "../../../../lib/env";

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

export function areTenantPlanGatesDisabled(): boolean {
	return env.disableTenantPlanGates;
}

export function enabledFeatures(features: SubscriptionPlanFeatures): TenantPlanFeature[] {
	if (areTenantPlanGatesDisabled()) {
		return [...FEATURE_KEYS];
	}

	return FEATURE_KEYS.filter((feature) => features[feature]);
}

export function isPlanFeatureEnabled(
	features: SubscriptionPlanFeatures,
	feature: TenantPlanFeature,
): boolean {
	if (areTenantPlanGatesDisabled()) {
		return true;
	}

	return features[feature] === true;
}
