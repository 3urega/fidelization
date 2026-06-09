import { isLocalDevApexHost, resolveTenantAppUrl } from "./resolveTenantAppUrl";

export { isLocalDevApexHost };

/** Post-auth destination: tenant subdomain `/panel` in production; same-host `/panel` on local apex. */
export function resolveTenantHomeUrl(tenantSlug: string): string {
	return resolveTenantAppUrl(tenantSlug, "/panel");
}

/** After business creation: owner picks a SaaS plan before the dashboard. */
export function resolveTenantOnboardingPlanUrl(tenantSlug: string): string {
	return resolveTenantAppUrl(tenantSlug, "/onboarding/plan");
}
