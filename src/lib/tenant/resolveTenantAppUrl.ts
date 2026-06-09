import { formatTenantHost } from "./formatTenantHost";

/** Apex hosts where host-only cookies block apex → subdomain redirect (local dev). */
export function isLocalDevApexHost(hostname: string): boolean {
	return hostname === "localhost" || hostname === "127.0.0.1";
}

export function resolveTenantAppUrl(tenantSlug: string, path: string): string {
	const normalizedPath = path.startsWith("/") ? path : `/${path}`;

	if (typeof window === "undefined" || !tenantSlug.trim()) {
		return normalizedPath;
	}

	const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN?.trim();
	if (!appDomain) {
		return normalizedPath;
	}

	const { protocol, port, hostname } = window.location;

	if (isLocalDevApexHost(hostname)) {
		return normalizedPath;
	}

	const tenantHost = formatTenantHost({
		slug: tenantSlug,
		appDomain,
		port: port || undefined,
	});

	if (!tenantHost) {
		return normalizedPath;
	}

	if (hostname === `${tenantSlug}.${appDomain}`) {
		return normalizedPath;
	}

	return `${protocol}//${tenantHost}${normalizedPath}`;
}
