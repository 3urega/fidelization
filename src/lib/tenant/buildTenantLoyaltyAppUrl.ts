import { formatTenantHost } from "./formatTenantHost";

export type BuildTenantLoyaltyAppUrlParams = {
	slug: string;
	appDomain: string | undefined;
	protocol?: string;
	port?: string;
};

/**
 * Full URL for the end-customer loyalty app on the tenant subdomain.
 *
 * @example buildTenantLoyaltyAppUrl({ slug: "cafe-demo", appDomain: "localhost", port: "3000" })
 *   → "http://cafe-demo.localhost:3000/app"
 */
export function buildTenantLoyaltyAppUrl(params: BuildTenantLoyaltyAppUrlParams): string | null {
	const host = formatTenantHost({
		slug: params.slug,
		appDomain: params.appDomain,
		port: params.port,
	});

	if (!host) {
		return null;
	}

	const protocol = params.protocol?.replace(/:$/, "") || "http";

	return `${protocol}://${host}/app`;
}
