import { formatTenantHost } from "./formatTenantHost";

/** Apex hosts where host-only cookies block apex → subdomain redirect (local dev). */
export function isLocalDevApexHost(hostname: string): boolean {
	return hostname === "localhost" || hostname === "127.0.0.1";
}

/**
 * Post-auth destination: tenant subdomain `/home` in production; same-host `/home` on local apex.
 */
export function resolveTenantHomeUrl(tenantSlug: string): string {
	if (typeof window === "undefined" || !tenantSlug.trim()) {
		return "/home";
	}

	const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN?.trim();
	if (!appDomain) {
		return "/home";
	}

	const { protocol, port, hostname } = window.location;

	if (isLocalDevApexHost(hostname)) {
		return "/home";
	}

	const tenantHost = formatTenantHost({
		slug: tenantSlug,
		appDomain,
		port: port || undefined,
	});

	if (!tenantHost) {
		return "/home";
	}

	if (hostname === `${tenantSlug}.${appDomain}`) {
		return "/home";
	}

	return `${protocol}//${tenantHost}/home`;
}
