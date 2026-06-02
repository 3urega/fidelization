/**
 * Extract tenant slug from Host when APP_DOMAIN is configured.
 *
 * @example extractSubdomain("cafe-demo.localhost:3000", "localhost") → "cafe-demo"
 * @example extractSubdomain("localhost:3000", "localhost") → null
 */
export function extractSubdomain(hostHeader: string | null, appDomain: string | undefined): string | null {
	if (!appDomain || !hostHeader) {
		return null;
	}

	const host = hostHeader.split(":")[0]?.toLowerCase() ?? "";
	const domain = appDomain.toLowerCase();

	if (!host || host === domain || host === `www.${domain}`) {
		return null;
	}

	const suffix = `.${domain}`;
	if (!host.endsWith(suffix)) {
		return null;
	}

	const subdomain = host.slice(0, host.length - suffix.length);

	if (!subdomain || subdomain.includes(".") || subdomain === "www") {
		return null;
	}

	return subdomain;
}
