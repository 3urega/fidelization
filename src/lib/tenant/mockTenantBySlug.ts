import type { ResolvedTenant } from "./resolveTenant";

/** Matches `prisma/seed.ts` demo tenant. */
export const DEMO_TENANT_ID = "00000000-0000-4000-8000-000000000002";

export type TenantBrandingBySlug = ResolvedTenant & {
	name: string;
	primaryColor: string;
	secondaryColor: string;
};

const tenantsBySlug: Record<string, TenantBrandingBySlug> = {
	"cafe-demo": {
		slug: "cafe-demo",
		tenantId: DEMO_TENANT_ID,
		name: "Café Demo",
		primaryColor: "#7C3AED",
		secondaryColor: "#4F46E5",
	},
};

export function loadTenantBySlug(slug: string): ResolvedTenant | null {
	const row = tenantsBySlug[slug];

	return row ? { slug: row.slug, tenantId: row.tenantId } : null;
}

export function getTenantBrandingBySlug(slug: string): TenantBrandingBySlug | null {
	return tenantsBySlug[slug] ?? null;
}
