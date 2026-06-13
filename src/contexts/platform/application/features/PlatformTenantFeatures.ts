import { Service } from "diod";

import { ResolveTenantEffectivePlanFeatures } from "../../../billing/subscriptions/application/resolve/ResolveTenantEffectivePlanFeatures";
import type { SubscriptionPlanFeatures } from "../../../billing/subscriptions/domain/SubscriptionPlanFeatures";
import {
	parseTenantFeatureOverrides,
	type TenantFeatureOverrides,
} from "../../../billing/subscriptions/domain/TenantFeatureOverrides";
import { TenantNotFound } from "../../../tenants/tenants/domain/TenantNotFound";
import { TenantRepository } from "../../../tenants/tenants/domain/TenantRepository";
import { PLATFORM_PLAN_FEATURE_CATALOG } from "../../../../lib/platform/featureCatalog";

export type PlatformTenantFeaturesView = {
	tenantId: string;
	tenantSlug: string;
	tenantName: string;
	planId: string;
	planName: string;
	planFeatures: SubscriptionPlanFeatures;
	overrides: TenantFeatureOverrides | null;
	effectiveFeatures: SubscriptionPlanFeatures;
	featureCatalog: typeof PLATFORM_PLAN_FEATURE_CATALOG;
	precedence: string;
};

@Service()
export class GetPlatformTenantFeatures {
	constructor(
		private readonly tenantRepository: TenantRepository,
		private readonly resolveTenantEffectivePlanFeatures: ResolveTenantEffectivePlanFeatures,
	) {}

	async execute(tenantId: string): Promise<PlatformTenantFeaturesView> {
		const tenant = await this.tenantRepository.findById(tenantId);
		if (!tenant) {
			throw new TenantNotFound(tenantId);
		}

		const resolved = await this.resolveTenantEffectivePlanFeatures.execute(tenantId);
		const primitives = tenant.toPrimitives();
		const planPrimitives = resolved.plan.toPrimitives();

		return {
			tenantId: primitives.id,
			tenantSlug: primitives.slug,
			tenantName: primitives.name,
			planId: planPrimitives.id,
			planName: planPrimitives.name,
			planFeatures: planPrimitives.features,
			overrides: resolved.overrides,
			effectiveFeatures: resolved.effectiveFeatures,
			featureCatalog: PLATFORM_PLAN_FEATURE_CATALOG,
			precedence: "Tenant override wins when set; otherwise plan catalog applies.",
		};
	}
}

export type UpdatePlatformTenantFeaturesParams = {
	tenantId: string;
	overrides: TenantFeatureOverrides | null;
};

@Service()
export class UpdatePlatformTenantFeatures {
	constructor(
		private readonly tenantRepository: TenantRepository,
		private readonly getPlatformTenantFeatures: GetPlatformTenantFeatures,
	) {}

	async execute(params: UpdatePlatformTenantFeaturesParams): Promise<PlatformTenantFeaturesView> {
		const tenant = await this.tenantRepository.findById(params.tenantId);
		if (!tenant) {
			throw new TenantNotFound(params.tenantId);
		}

		const normalized =
			params.overrides === null ? null : parseTenantFeatureOverrides(params.overrides);

		await this.tenantRepository.updateFeatureOverrides(params.tenantId, normalized);

		return this.getPlatformTenantFeatures.execute(params.tenantId);
	}
}
