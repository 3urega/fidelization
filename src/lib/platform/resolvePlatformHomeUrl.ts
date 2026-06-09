import { isLocalDevApexHost } from "../tenant/resolveTenantAppUrl";

const PLATFORM_HOME_PATH = "/u/home";

/** Client: platform user dashboard on apex; from tenant subdomain redirects to apex host. */
export function resolvePlatformHomeUrl(): string {
	if (typeof window === "undefined") {
		return PLATFORM_HOME_PATH;
	}

	const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN?.trim();
	if (!appDomain) {
		return PLATFORM_HOME_PATH;
	}

	const { protocol, port, hostname } = window.location;

	if (isLocalDevApexHost(hostname) || hostname === appDomain) {
		return PLATFORM_HOME_PATH;
	}

	const portSuffix = port && port !== "80" && port !== "443" ? `:${port}` : "";

	return `${protocol}//${appDomain}${portSuffix}${PLATFORM_HOME_PATH}`;
}

/** Server: build redirect target for POST /api/user/enter responses. */
export function resolvePlatformHomeUrlFromRequest(request: Request): string {
	const appDomain =
		process.env.NEXT_PUBLIC_APP_DOMAIN?.trim() ?? process.env.APP_DOMAIN?.trim();

	if (!appDomain) {
		return PLATFORM_HOME_PATH;
	}

	let url: URL;
	try {
		url = new URL(request.url);
	} catch {
		return PLATFORM_HOME_PATH;
	}

	if (isLocalDevApexHost(url.hostname) || url.hostname === appDomain) {
		return PLATFORM_HOME_PATH;
	}

	const portSuffix = url.port && url.port !== "80" && url.port !== "443" ? `:${url.port}` : "";

	return `${url.protocol}//${appDomain}${portSuffix}${PLATFORM_HOME_PATH}`;
}
