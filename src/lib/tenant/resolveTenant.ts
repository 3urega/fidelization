/**
 * Tenant resolution from the incoming request (Edge-safe).
 *
 * Fase 0 / issue #4: no-op — active tenant comes from the session JWT (`tenantId`)
 * after login. Subdomain → `tenants.slug` lookup is target; see docs/teenant-resolution.md.
 */
export type ResolvedTenant = {
	slug: string;
	tenantId: string;
};

export function resolveTenantFromRequest(_request: Request): ResolvedTenant | null {
	// Target: parse Host (e.g. cafe-demo.app.example.com) and load tenant by slug.
	return null;
}
