import { extractSubdomain } from "./extractSubdomain";
import { loadTenantBySlug } from "./mockTenantBySlug";

export type ResolvedTenant = {
	slug: string;
	tenantId: string;
};

export type TenantResolution =
	| { status: "inactive" }
	| { status: "not_found"; slug: string }
	| { status: "resolved"; tenant: ResolvedTenant };

function getAppDomain(): string | undefined {
	return process.env.APP_DOMAIN?.trim() || undefined;
}

/** Sync tenant lookup from Host (API routes when middleware headers are missing). */
export function resolveTenantFromHost(hostHeader: string | null): ResolvedTenant | null {
	const appDomain = getAppDomain();
	if (!appDomain || !hostHeader) {
		return null;
	}

	const slug = extractSubdomain(hostHeader, appDomain);
	if (!slug) {
		return null;
	}

	return loadTenantBySlug(slug);
}

/**
 * Resolve tenant from request Host (Edge-safe, mock slug map).
 * Requires APP_DOMAIN. Apex host returns inactive (JWT/session flow unchanged).
 */
export async function resolveTenantFromRequest(request: Request): Promise<TenantResolution> {
	const appDomain = getAppDomain();
	if (!appDomain) {
		return { status: "inactive" };
	}

	const tenant = resolveTenantFromHost(request.headers.get("host"));
	if (!tenant) {
		const slug = extractSubdomain(request.headers.get("host"), appDomain);
		if (!slug) {
			return { status: "inactive" };
		}

		return { status: "not_found", slug };
	}

	return { status: "resolved", tenant };
}
