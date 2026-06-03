export type FormatTenantHostParams = {
	slug: string;
	appDomain: string | undefined;
	port?: string;
};

/**
 * Builds tenant host from slug and apex domain (subdomain routing).
 *
 * @example formatTenantHost({ slug: "cafe-joan", appDomain: "localhost", port: "3000" })
 *   → "cafe-joan.localhost:3000"
 */
export function formatTenantHost(params: FormatTenantHostParams): string | null {
	const slug = params.slug.trim();
	const appDomain = params.appDomain?.trim();

	if (!slug || !appDomain) {
		return null;
	}

	const host = `${slug}.${appDomain}`;
	const port = params.port?.trim();

	if (port && port !== "80" && port !== "443") {
		return `${host}:${port}`;
	}

	return host;
}
