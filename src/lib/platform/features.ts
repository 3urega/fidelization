import type { SubscriptionPlanFeatures } from "../../contexts/billing/subscriptions/domain/SubscriptionPlanFeatures";
import type { TenantFeatureOverrides } from "../../contexts/billing/subscriptions/domain/TenantFeatureOverrides";
import type { PlatformTenantFeaturesView } from "../../contexts/platform/application/features/PlatformTenantFeatures";
import type { ListPlatformPlanFeaturesResult } from "../../contexts/platform/application/features/PlatformPlanFeatures";
import { subscriptionPlanToJson } from "../auth/http";
import { PLATFORM_FEATURE_PRECEDENCE } from "./featureCatalog";
import type { SubscriptionPlan } from "../../contexts/billing/subscriptions/domain/SubscriptionPlan";

export type PlatformPlanFeaturesResponse = ListPlatformPlanFeaturesResult;

export type PlatformTenantFeaturesResponse = Omit<PlatformTenantFeaturesView, "featureCatalog"> & {
	featureCatalog: PlatformTenantFeaturesView["featureCatalog"];
};

export function platformPlanFeaturesToJson(
	result: ListPlatformPlanFeaturesResult,
): PlatformPlanFeaturesResponse {
	return {
		plans: result.plans,
		featureCatalog: result.featureCatalog,
		precedence: PLATFORM_FEATURE_PRECEDENCE,
	};
}

export function platformTenantFeaturesToJson(
	view: PlatformTenantFeaturesView,
): PlatformTenantFeaturesResponse {
	return {
		tenantId: view.tenantId,
		tenantSlug: view.tenantSlug,
		tenantName: view.tenantName,
		planId: view.planId,
		planName: view.planName,
		planFeatures: view.planFeatures,
		overrides: view.overrides,
		effectiveFeatures: view.effectiveFeatures,
		featureCatalog: view.featureCatalog,
		precedence: view.precedence,
	};
}

export function subscriptionPlanFeaturesToJson(
	features: SubscriptionPlanFeatures,
): SubscriptionPlanFeatures {
	return { ...features };
}

export function subscriptionPlanFeaturesPatchToJson(plan: SubscriptionPlan): {
	plan: ReturnType<typeof subscriptionPlanToJson>;
} {
	return { plan: subscriptionPlanToJson(plan) };
}

export type PlatformTenantFeaturesPatchBody = {
	overrides: TenantFeatureOverrides | null;
};
