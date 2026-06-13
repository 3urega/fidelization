import type { SubscriptionPlanFeatures } from "./SubscriptionPlanFeatures";
import type { TenantPlanFeature } from "./TenantPlanFeature";

/** Partial overrides stored in tenants.features. Precedence: override wins when key is set. */
export type TenantFeatureOverrides = Partial<Record<TenantPlanFeature, boolean>>;

export function parseTenantFeatureOverrides(value: unknown): TenantFeatureOverrides | null {
	if (!value || typeof value !== "object") {
		return null;
	}

	const record = value as Record<string, unknown>;
	const overrides: TenantFeatureOverrides = {};

	for (const key of Object.keys(record)) {
		if (typeof record[key] === "boolean") {
			overrides[key as TenantPlanFeature] = record[key];
		}
	}

	return Object.keys(overrides).length > 0 ? overrides : null;
}

export function mergeEffectivePlanFeatures(
	planFeatures: SubscriptionPlanFeatures,
	overrides: TenantFeatureOverrides | null,
): SubscriptionPlanFeatures {
	if (!overrides) {
		return { ...planFeatures };
	}

	const effective = { ...planFeatures };

	for (const [key, value] of Object.entries(overrides)) {
		if (typeof value === "boolean") {
			effective[key as TenantPlanFeature] = value;
		}
	}

	return effective;
}
