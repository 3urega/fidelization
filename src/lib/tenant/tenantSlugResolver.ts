import { extractSubdomain } from "./extractSubdomain";
import { loadTenantBySlug } from "./mockTenantBySlug";
import type { ResolvedTenant } from "./resolveTenant";
import { getAppDomain } from "./resolveTenant";

const CACHE_TTL_MS = 60_000;
const NEGATIVE_CACHE_TTL_MS = 10_000;

type CacheEntry =
	| { hit: true; tenant: ResolvedTenant; expiresAt: number }
	| { hit: false; expiresAt: number };

const slugCache = new Map<string, CacheEntry>();

function getCached(slug: string): ResolvedTenant | null | undefined {
	const entry = slugCache.get(slug);
	if (!entry || entry.expiresAt <= Date.now()) {
		slugCache.delete(slug);

		return undefined;
	}

	if (entry.hit) {
		return entry.tenant;
	}

	return null;
}

function setCached(slug: string, tenant: ResolvedTenant | null): void {
	if (tenant) {
		slugCache.set(slug, { hit: true, tenant, expiresAt: Date.now() + CACHE_TTL_MS });
	} else {
		slugCache.set(slug, { hit: false, expiresAt: Date.now() + NEGATIVE_CACHE_TTL_MS });
	}
}

async function fetchTenantBySlugFromApi(
	slug: string,
	origin: string,
): Promise<ResolvedTenant | null> {
	const cached = getCached(slug);
	if (cached !== undefined) {
		return cached;
	}

	try {
		const url = new URL("/api/tenant/resolve", origin);
		url.searchParams.set("slug", slug);
		const response = await fetch(url.toString(), { cache: "no-store" });
		if (!response.ok) {
			setCached(slug, null);

			return null;
		}

		const data = (await response.json()) as { slug: string; tenantId: string };
		const tenant: ResolvedTenant = { slug: data.slug, tenantId: data.tenantId };
		setCached(slug, tenant);

		return tenant;
	} catch {
		return null;
	}
}

/**
 * Resolve tenant from Host: mock fast-path, then Prisma via internal API (Edge-safe).
 */
export async function resolveTenantFromHostAsync(
	hostHeader: string | null,
	requestOrigin: string,
): Promise<ResolvedTenant | null> {
	const appDomain = getAppDomain();
	if (!appDomain || !hostHeader) {
		return null;
	}

	const slug = extractSubdomain(hostHeader, appDomain);
	if (!slug) {
		return null;
	}

	const fromMock = loadTenantBySlug(slug);
	if (fromMock) {
		return fromMock;
	}

	return fetchTenantBySlugFromApi(slug, requestOrigin);
}
