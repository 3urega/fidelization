import { DomainError } from "../../../shared/domain/DomainError";

import type { TenantPlanFeature } from "./TenantPlanFeature";

export class PlanFeatureNotAvailable extends DomainError {
	readonly type = "PlanFeatureNotAvailable";
	readonly message: string;
	readonly tenantId: string;
	readonly feature: TenantPlanFeature;

	constructor(tenantId: string, feature: TenantPlanFeature) {
		const message = `Plan feature ${feature} is not available for this tenant`;
		super(message);
		this.message = message;
		this.tenantId = tenantId;
		this.feature = feature;
	}
}
