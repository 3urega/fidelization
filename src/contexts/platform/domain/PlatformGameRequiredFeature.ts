import type { TenantPlanFeature } from "../../billing/subscriptions/domain/TenantPlanFeature";

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

export function parsePlatformGameRequiredFeature(value: unknown): TenantPlanFeature {
	const feature = String(value ?? "gamification").trim();

	if (!FEATURE_KEYS.includes(feature as TenantPlanFeature)) {
		throw new Error(`Invalid requiredFeature: ${String(value)}`);
	}

	return feature as TenantPlanFeature;
}
