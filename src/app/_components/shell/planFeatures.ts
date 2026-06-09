import type { TenantSessionData } from "./TenantSessionProvider";

export function tenantHasFeature(session: TenantSessionData, feature: string): boolean {
	return session.planFeatures?.includes(feature) ?? false;
}
