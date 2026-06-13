import { env } from "../env";
import { formatTenantHost } from "./formatTenantHost";
import { isLocalDevApexHost } from "./resolveTenantAppUrl";

export function resolveTenantPanelRedirectUrl(request: Request, tenantSlug: string): string {
	const url = new URL(request.url);
	const normalizedSlug = tenantSlug.trim();

	if (!normalizedSlug) {
		return "/panel";
	}

	if (isLocalDevApexHost(url.hostname)) {
		return "/panel";
	}

	const appDomain = env.appDomain ?? process.env.NEXT_PUBLIC_APP_DOMAIN?.trim();
	const tenantHost = formatTenantHost({
		slug: normalizedSlug,
		appDomain,
		port: url.port || undefined,
	});

	if (!tenantHost) {
		return "/panel";
	}

	return `${url.protocol}//${tenantHost}/panel`;
}
